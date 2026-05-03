import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { db } from '../db/index.js'
import { applications, interviews } from '../db/schema.js'
import { eq, and, isNull, sql, count, inArray, notInArray, gte, lte } from 'drizzle-orm'
import { redis } from '../lib/redis.js'
import { logger } from '../middleware/request-logger.js'
import { DashboardSchema } from '@parcours/shared'

type Variables = { traceId: string; user: { id: string; email: string } }

export const dashboardRoutes = new OpenAPIHono<{ Variables: Variables }>()

const CACHE_TTL = 60

const dashboardRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: { 'application/json': { schema: DashboardSchema } },
      description: 'Dashboard stats',
    },
  },
})

dashboardRoutes.openapi(dashboardRoute, async (c) => {
  const user = c.get('user')
  const cacheKey = `dashboard:${user.id}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      return c.json(parsed, 200)
    }
  } catch (err) {
    logger.warn({ err }, 'dashboard cache read error — falling back to live query')
  }

  const data = await computeDashboard(user.id)

  try {
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL)
  } catch (err) {
    logger.warn({ err }, 'dashboard cache write error')
  }

  return c.json(data, 200)
})

async function computeDashboard(userId: string) {
  const ACTIVE_EXCLUDED = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const
  const OFFER_STATES = ['OFFER', 'ACCEPTED'] as const
  const RESPONSE_STATES = ['PHONE', 'TECHNICAL', 'ONSITE', 'OFFER', 'ACCEPTED'] as const

  const baseWhere = and(eq(applications.userId, userId), isNull(applications.deletedAt))

  const [totals] = await db
    .select({ total: count() })
    .from(applications)
    .where(baseWhere)

  const totalApplied = Number(totals?.total ?? 0)

  const [active] = await db
    .select({ total: count() })
    .from(applications)
    .where(and(baseWhere, notInArray(applications.status, [...ACTIVE_EXCLUDED])))

  const [offers] = await db
    .select({ total: count() })
    .from(applications)
    .where(and(baseWhere, inArray(applications.status, [...OFFER_STATES])))

  const statusCounts = await db
    .select({ status: applications.status, cnt: count() })
    .from(applications)
    .where(baseWhere)
    .groupBy(applications.status)

  const byStatus: Record<string, number> = {}
  for (const row of statusCounts) {
    byStatus[row.status] = Number(row.cnt)
  }

  const [responseCount] = await db
    .select({ total: count() })
    .from(applications)
    .where(and(baseWhere, inArray(applications.status, [...RESPONSE_STATES])))

  const responseRate =
    totalApplied > 0 ? (Number(responseCount?.total ?? 0) / totalApplied) * 100 : 0

  const [avgRow] = await db
    .select({
      avg: sql<number>`AVG(EXTRACT(EPOCH FROM (now() - ${applications.appliedAt})) / 86400)`,
    })
    .from(applications)
    .where(and(baseWhere, inArray(applications.status, [...OFFER_STATES])))

  const avgDaysToOffer = avgRow?.avg != null ? Number(avgRow.avg) : null

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcoming = await db
    .select({
      id: interviews.id,
      applicationId: interviews.applicationId,
      company: applications.company,
      role: applications.role,
      type: interviews.type,
      scheduledAt: interviews.scheduledAt,
    })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .where(
      and(
        eq(applications.userId, userId),
        isNull(applications.deletedAt),
        isNull(interviews.deletedAt),
        gte(interviews.scheduledAt, now),
        lte(interviews.scheduledAt, in7Days),
      ),
    )
    .orderBy(interviews.scheduledAt)

  return {
    totalApplied,
    activeCount: Number(active?.total ?? 0),
    offerCount: Number(offers?.total ?? 0),
    byStatus,
    responseRate: Math.round(responseRate * 100) / 100,
    avgDaysToOffer,
    upcomingInterviews: upcoming.map((u) => ({
      id: u.id,
      applicationId: u.applicationId!,
      company: u.company,
      role: u.role,
      type: u.type,
      scheduledAt: u.scheduledAt.toISOString(),
    })),
  }
}
