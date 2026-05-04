import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../db/index.js";
import { applications, interviews } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { CreateInterviewSchema, UpdateInterviewSchema } from "@parcours/shared";

type Variables = { traceId: string; user: { id: string; email: string } };

export const interviewRoutes = new OpenAPIHono<{ Variables: Variables }>();

const InterviewResponseSchema = z.object({
  id: z.string().uuid(),
  applicationId: z.string().uuid(),
  type: z.string(),
  scheduledAt: z.string(),
  outcome: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().nullable(),
});

async function assertApplicationOwnership(appId: string, userId: string) {
  const [app] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.id, appId),
        eq(applications.userId, userId),
        isNull(applications.deletedAt),
      ),
    )
    .limit(1);
  return app ?? null;
}

const listRoute = createRoute({
  method: "get",
  path: "/:appId/interviews",
  request: { params: z.object({ appId: z.string().uuid() }) },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(InterviewResponseSchema) },
      },
      description: "Interviews",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Application not found",
    },
  },
});

interviewRoutes.openapi(listRoute, async (c) => {
  const user = c.get("user");
  const { appId } = c.req.valid("param");

  if (!(await assertApplicationOwnership(appId, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const data = await db
    .select()
    .from(interviews)
    .where(
      and(eq(interviews.applicationId, appId), isNull(interviews.deletedAt)),
    )
    .orderBy(interviews.scheduledAt);

  return c.json(data.map(toResponse), 200);
});

const createRoute_ = createRoute({
  method: "post",
  path: "/:appId/interviews",
  request: {
    params: z.object({ appId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: CreateInterviewSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: InterviewResponseSchema } },
      description: "Created",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Application not found",
    },
  },
});

interviewRoutes.openapi(createRoute_, async (c) => {
  const user = c.get("user");
  const { appId } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!(await assertApplicationOwnership(appId, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const [interview] = await db
    .insert(interviews)
    .values({
      applicationId: appId,
      type: body.type,
      scheduledAt: new Date(body.scheduledAt),
      outcome: body.outcome ?? "pending",
      notes: body.notes ?? null,
    })
    .returning();

  return c.json(toResponse(interview), 201);
});

const updateRoute = createRoute({
  method: "patch",
  path: "/:appId/interviews/:id",
  request: {
    params: z.object({ appId: z.string().uuid(), id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateInterviewSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: InterviewResponseSchema } },
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

interviewRoutes.openapi(updateRoute, async (c) => {
  const user = c.get("user");
  const { appId, id } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!(await assertApplicationOwnership(appId, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const [existing] = await db
    .select()
    .from(interviews)
    .where(
      and(
        eq(interviews.id, id),
        eq(interviews.applicationId, appId),
        isNull(interviews.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const [updated] = await db
    .update(interviews)
    .set({
      type: body.type ?? existing.type,
      scheduledAt: body.scheduledAt
        ? new Date(body.scheduledAt)
        : existing.scheduledAt,
      outcome: body.outcome ?? existing.outcome,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    })
    .where(eq(interviews.id, id))
    .returning();

  return c.json(toResponse(updated), 200);
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/:appId/interviews/:id",
  request: {
    params: z.object({ appId: z.string().uuid(), id: z.string().uuid() }),
  },
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

interviewRoutes.openapi(deleteRoute, async (c) => {
  const user = c.get("user");
  const { appId, id } = c.req.valid("param");

  if (!(await assertApplicationOwnership(appId, user.id))) {
    return c.json({ error: "Not found" }, 404);
  }

  const [existing] = await db
    .select({ id: interviews.id })
    .from(interviews)
    .where(
      and(
        eq(interviews.id, id),
        eq(interviews.applicationId, appId),
        isNull(interviews.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await db
    .update(interviews)
    .set({ deletedAt: new Date() })
    .where(eq(interviews.id, id));

  return c.body(null, 204);
});

function toResponse(iv: typeof interviews.$inferSelect) {
  return {
    id: iv.id,
    applicationId: iv.applicationId!,
    type: iv.type,
    scheduledAt: iv.scheduledAt.toISOString(),
    outcome: iv.outcome,
    notes: iv.notes,
    createdAt: iv.createdAt?.toISOString() ?? null,
  };
}
