import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { db } from '../db/index.js'
import { applications } from '../db/schema.js'
import { eq, and, isNull, ilike, or, sql, count } from 'drizzle-orm'
import { CreateApplicationSchema, UpdateApplicationSchema, STATUS_TRANSITIONS, ApplicationStatus } from '@parcours/shared'

type Variables = { traceId: string; user: { id: string; email: string } }

export const applicationRoutes = new OpenAPIHono<{ Variables: Variables }>()

const ApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  status: z.string(),
  jdUrl: z.string().nullable(),
  salaryRange: z.string().nullable(),
  jdText: z.string().nullable(),
  notes: z.string().nullable(),
  appliedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
})

const listRoute = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      status: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ data: z.array(ApplicationResponseSchema), total: z.number() }),
        },
      },
      description: 'List of applications',
    },
  },
})

applicationRoutes.openapi(listRoute, async (c) => {
  const user = c.get('user')
  const { status, search, page, limit } = c.req.valid('query')
  const offset = (page - 1) * limit

  const conditions = [eq(applications.userId, user.id), isNull(applications.deletedAt)]

  if (status) {
    conditions.push(eq(applications.status, status))
  }

  if (search) {
    conditions.push(
      or(
        ilike(applications.company, `%${search}%`),
        ilike(applications.role, `%${search}%`),
      )!,
    )
  }

  const where = and(...conditions)

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(applications)
    .where(where)

  const data = await db
    .select()
    .from(applications)
    .where(where)
    .orderBy(sql`${applications.appliedAt} DESC`)
    .limit(limit)
    .offset(offset)

  return c.json({
    data: data.map(toResponse),
    total: Number(total),
  })
})

const getRoute = createRoute({
  method: 'get',
  path: '/:id',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: ApplicationResponseSchema } },
      description: 'Application',
    },
    404: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Not found',
    },
  },
})

applicationRoutes.openapi(getRoute, async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')

  const [app] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id), isNull(applications.deletedAt)))
    .limit(1)

  if (!app) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json(toResponse(app), 200)
})

const createRoute_ = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: { content: { 'application/json': { schema: CreateApplicationSchema } }, required: true },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: ApplicationResponseSchema } },
      description: 'Created',
    },
  },
})

applicationRoutes.openapi(createRoute_, async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')

  const [app] = await db
    .insert(applications)
    .values({
      userId: user.id,
      company: body.company,
      role: body.role,
      status: body.status ?? 'APPLIED',
      jdUrl: body.jdUrl ?? null,
      salaryRange: body.salaryRange ?? null,
      notes: body.notes ?? null,
      appliedAt: body.appliedAt ? new Date(body.appliedAt) : undefined,
    })
    .returning()

  return c.json(toResponse(app), 201)
})

const updateRoute = createRoute({
  method: 'patch',
  path: '/:id',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: UpdateApplicationSchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ApplicationResponseSchema } },
      description: 'Updated',
    },
    400: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Invalid status transition',
    },
    404: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Not found',
    },
  },
})

applicationRoutes.openapi(updateRoute, async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  const [existing] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id), isNull(applications.deletedAt)))
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (body.status && body.status !== existing.status) {
    const valid = STATUS_TRANSITIONS[existing.status as ApplicationStatus]
    if (!valid.includes(body.status as ApplicationStatus)) {
      return c.json({ error: `Cannot transition from ${existing.status} to ${body.status}` }, 400)
    }
  }

  const merged = {
    company: body.company ?? existing.company,
    role: body.role ?? existing.role,
    status: body.status ?? existing.status,
    jdUrl: body.jdUrl !== undefined ? body.jdUrl : existing.jdUrl,
    salaryRange: body.salaryRange !== undefined ? body.salaryRange : existing.salaryRange,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    appliedAt: body.appliedAt ? new Date(body.appliedAt) : existing.appliedAt,
  }

  const [updated] = await db
    .update(applications)
    .set(merged)
    .where(eq(applications.id, id))
    .returning()

  return c.json(toResponse(updated), 200)
})

const deleteRoute = createRoute({
  method: 'delete',
  path: '/:id',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: 'Deleted' },
    404: {
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
      description: 'Not found',
    },
  },
})

applicationRoutes.openapi(deleteRoute, async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')

  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id), isNull(applications.deletedAt)))
    .limit(1)

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  await db.update(applications).set({ deletedAt: new Date() }).where(eq(applications.id, id))

  return c.body(null, 204)
})

function toResponse(app: typeof applications.$inferSelect) {
  return {
    id: app.id,
    userId: app.userId!,
    company: app.company,
    role: app.role,
    status: app.status,
    jdUrl: app.jdUrl,
    salaryRange: app.salaryRange,
    jdText: app.jdText,
    notes: app.notes,
    appliedAt: app.appliedAt?.toISOString() ?? null,
    createdAt: app.createdAt?.toISOString() ?? null,
  }
}
