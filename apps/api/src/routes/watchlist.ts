import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { streamText as honoStreamText } from "hono/streaming";
import { db } from "../db/index.js";
import { watchlist, applications } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import {
  CreateWatchlistSchema,
  UpdateWatchlistSchema,
  FitAnalysisSchema,
} from "@parcours/shared";
import { streamAnalysis } from "../lib/ai.js";
import { env } from "../env.js";

type Variables = { traceId: string; user: { id: string; email: string } };

export const watchlistRoutes = new OpenAPIHono<{ Variables: Variables }>();

const WatchlistResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  company: z.string(),
  role: z.string(),
  jdUrl: z.string().nullable(),
  jdText: z.string().nullable(),
  salaryRange: z.string().nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  fitAnalysis: z.unknown().nullable(),
  analyzedAt: z.string().nullable(),
  createdAt: z.string().nullable(),
});

const listRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(WatchlistResponseSchema) },
      },
      description: "Watchlist",
    },
  },
});

watchlistRoutes.openapi(listRoute, async (c) => {
  const user = c.get("user");

  const data = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, user.id), isNull(watchlist.deletedAt)))
    .orderBy(watchlist.createdAt);

  return c.json(data.map(toResponse), 200);
});

const getRoute = createRoute({
  method: "get",
  path: "/:id",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: WatchlistResponseSchema } },
      description: "Watchlist item",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

watchlistRoutes.openapi(getRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const [item] = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.id, id),
        eq(watchlist.userId, user.id),
        isNull(watchlist.deletedAt),
      ),
    )
    .limit(1);

  if (!item) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toResponse(item), 200);
});

const createRoute_ = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: { "application/json": { schema: CreateWatchlistSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: WatchlistResponseSchema } },
      description: "Created",
    },
  },
});

watchlistRoutes.openapi(createRoute_, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const [item] = await db
    .insert(watchlist)
    .values({
      userId: user.id,
      company: body.company,
      role: body.role,
      jdUrl: body.jdUrl ?? null,
      jdText: body.jdText ?? null,
      salaryRange: body.salaryRange ?? null,
      tags: normalizeTags(body.tags ?? []),
      notes: body.notes ?? null,
    })
    .returning();

  return c.json(toResponse(item), 201);
});

const updateRoute = createRoute({
  method: "patch",
  path: "/:id",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateWatchlistSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: WatchlistResponseSchema } },
      description: "Updated",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

watchlistRoutes.openapi(updateRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const [existing] = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.id, id),
        eq(watchlist.userId, user.id),
        isNull(watchlist.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const [updated] = await db
    .update(watchlist)
    .set({
      company: body.company ?? existing.company,
      role: body.role ?? existing.role,
      jdUrl: body.jdUrl !== undefined ? body.jdUrl : existing.jdUrl,
      jdText: body.jdText !== undefined ? body.jdText : existing.jdText,
      salaryRange:
        body.salaryRange !== undefined
          ? body.salaryRange
          : existing.salaryRange,
      tags: body.tags !== undefined ? normalizeTags(body.tags) : existing.tags,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    })
    .where(eq(watchlist.id, id))
    .returning();

  return c.json(toResponse(updated), 200);
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/:id",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: "Deleted" },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

watchlistRoutes.openapi(deleteRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const [existing] = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.id, id),
        eq(watchlist.userId, user.id),
        isNull(watchlist.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await db
    .update(watchlist)
    .set({ deletedAt: new Date() })
    .where(eq(watchlist.id, id));

  return c.body(null, 204);
});

const analyzeRoute = createRoute({
  method: "post",
  path: "/:id/analyze",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { description: "Streamed analysis text/plain" },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

watchlistRoutes.openapi(analyzeRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const [item] = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.id, id),
        eq(watchlist.userId, user.id),
        isNull(watchlist.deletedAt),
      ),
    )
    .limit(1);

  if (!item) {
    return c.json({ error: "Not found" }, 404);
  }

  const prompt = buildAnalysisPrompt(item);
  const result = streamAnalysis(prompt, {
    abortSignal: AbortSignal.timeout(30_000),
  });

  return honoStreamText(c, async (stream) => {
    let accumulated = "";

    for await (const chunk of (await result).textStream) {
      accumulated += chunk;
      await stream.write(chunk);
    }

    try {
      const parsed = JSON.parse(accumulated);
      const analysis = FitAnalysisSchema.parse({
        ...parsed,
        provider: env.AI_PROVIDER,
        model: env.AI_MODEL,
      });

      await db
        .update(watchlist)
        .set({ fitAnalysis: analysis, analyzedAt: new Date() })
        .where(eq(watchlist.id, id));
    } catch {
      // Store raw if JSON parse or validation fails — don't break the stream
      await db
        .update(watchlist)
        .set({ analyzedAt: new Date() })
        .where(eq(watchlist.id, id));
    }
  });
});

const applyRoute = createRoute({
  method: "post",
  path: "/:id/apply",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ applicationId: z.string().uuid() }),
        },
      },
      description: "Applied",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

watchlistRoutes.openapi(applyRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const [item] = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.id, id),
        eq(watchlist.userId, user.id),
        isNull(watchlist.deletedAt),
      ),
    )
    .limit(1);

  if (!item) {
    return c.json({ error: "Not found" }, 404);
  }

  const [app] = await db
    .insert(applications)
    .values({
      userId: user.id,
      company: item.company,
      role: item.role,
      status: "APPLIED",
      jdUrl: item.jdUrl,
      jdText: item.jdText,
      salaryRange: item.salaryRange,
      notes: item.notes,
    })
    .returning({ id: applications.id });

  await db
    .update(watchlist)
    .set({ deletedAt: new Date() })
    .where(eq(watchlist.id, id));

  return c.json({ applicationId: app.id }, 200);
});

function buildAnalysisPrompt(item: typeof watchlist.$inferSelect): string {
  const parts = [
    `You are a career advisor. Analyze this job opportunity and return ONLY valid JSON matching this schema:`,
    `{ "skillsMatch": { "matched": [], "partial": [], "missing": [] }, "salaryFit": "good|ok|low|unknown", "overallScore": 0-100, "recommendation": "string", "concerns": [], "highlights": [] }`,
    ``,
    `Company: ${item.company}`,
    `Role: ${item.role}`,
  ];

  if (item.salaryRange) parts.push(`Salary Range: ${item.salaryRange}`);
  if (item.jdUrl) parts.push(`JD URL: ${item.jdUrl}`);
  if (item.jdText) parts.push(`\nJob Description:\n${item.jdText}`);

  return parts.join("\n");
}

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 20);
}

function toResponse(item: typeof watchlist.$inferSelect) {
  return {
    id: item.id,
    userId: item.userId!,
    company: item.company,
    role: item.role,
    jdUrl: item.jdUrl,
    jdText: item.jdText,
    salaryRange: item.salaryRange,
    tags: item.tags,
    notes: item.notes,
    fitAnalysis: item.fitAnalysis ?? null,
    analyzedAt: item.analyzedAt?.toISOString() ?? null,
    createdAt: item.createdAt?.toISOString() ?? null,
  };
}
