import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "../db/index.js";
import { questions, applicationQuestions, applications } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import {
  CreateQuestionSchema,
  UpdateQuestionSchema,
  LinkQuestionSchema,
} from "@parcours/shared";

type Variables = { traceId: string; user: { id: string; email: string } };

export const questionRoutes = new OpenAPIHono<{ Variables: Variables }>();

const QuestionResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  answer: z.string().nullable(),
  tags: z.array(z.string()),
  difficulty: z.string(),
  sourceCompany: z.string().nullable(),
  reviewCount: z.number(),
  nextReviewAt: z.string().nullable(),
  createdAt: z.string().nullable(),
});

const listRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(QuestionResponseSchema) },
      },
      description: "List of questions",
    },
  },
});

questionRoutes.openapi(listRoute, async (c) => {
  const user = c.get("user");

  const data = await db
    .select()
    .from(questions)
    .where(and(eq(questions.userId, user.id), isNull(questions.deletedAt)))
    .orderBy(questions.createdAt);

  return c.json(data.map(toResponse), 200);
});

const getRoute = createRoute({
  method: "get",
  path: "/:id",
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      content: { "application/json": { schema: QuestionResponseSchema } },
      description: "Question",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
  },
});

questionRoutes.openapi(getRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const [q] = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.id, id),
        eq(questions.userId, user.id),
        isNull(questions.deletedAt),
      ),
    )
    .limit(1);

  if (!q) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(toResponse(q), 200);
});

const createRoute_ = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: { "application/json": { schema: CreateQuestionSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: QuestionResponseSchema } },
      description: "Created",
    },
  },
});

questionRoutes.openapi(createRoute_, async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const [q] = await db
    .insert(questions)
    .values({
      userId: user.id,
      content: body.content,
      answer: body.answer ?? null,
      tags: body.tags ?? [],
      difficulty: body.difficulty ?? "medium",
      sourceCompany: body.sourceCompany ?? null,
    })
    .returning();

  return c.json(toResponse(q), 201);
});

const updateRoute = createRoute({
  method: "patch",
  path: "/:id",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: UpdateQuestionSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: QuestionResponseSchema } },
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

questionRoutes.openapi(updateRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const [existing] = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.id, id),
        eq(questions.userId, user.id),
        isNull(questions.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  const [updated] = await db
    .update(questions)
    .set({
      content: body.content ?? existing.content,
      answer: body.answer !== undefined ? body.answer : existing.answer,
      tags: body.tags ?? existing.tags,
      difficulty: body.difficulty ?? existing.difficulty,
      sourceCompany:
        body.sourceCompany !== undefined
          ? body.sourceCompany
          : existing.sourceCompany,
    })
    .where(eq(questions.id, id))
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

questionRoutes.openapi(deleteRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");

  const [existing] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(
        eq(questions.id, id),
        eq(questions.userId, user.id),
        isNull(questions.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await db
    .update(questions)
    .set({ deletedAt: new Date() })
    .where(eq(questions.id, id));

  return c.body(null, 204);
});

const linkRoute = createRoute({
  method: "post",
  path: "/:id/link",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: LinkQuestionSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ ok: z.boolean() }) },
      },
      description: "Linked",
    },
    404: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Not found",
    },
    409: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Already linked",
    },
  },
});

questionRoutes.openapi(linkRoute, async (c) => {
  const user = c.get("user");
  const { id } = c.req.valid("param");
  const { applicationId } = c.req.valid("json");

  const [q] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(
        eq(questions.id, id),
        eq(questions.userId, user.id),
        isNull(questions.deletedAt),
      ),
    )
    .limit(1);

  if (!q) {
    return c.json({ error: "Not found" }, 404);
  }

  const [app] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.userId, user.id),
        isNull(applications.deletedAt),
      ),
    )
    .limit(1);

  if (!app) {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    await db
      .insert(applicationQuestions)
      .values({ applicationId, questionId: id });
    return c.json({ ok: true as const }, 200);
  } catch (err: unknown) {
    if (pgErrorCode(err) === "23505") {
      return c.json({ error: "Already linked" }, 409);
    }
    throw err;
  }
});

function pgErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("code" in err) return (err as { code: string }).code;
  // DrizzleQueryError wraps the pg error in `cause`
  const cause = (err as { cause?: unknown }).cause;
  if (typeof cause === "object" && cause !== null && "code" in cause)
    return (cause as { code: string }).code;
  return undefined;
}

function toResponse(q: typeof questions.$inferSelect) {
  return {
    id: q.id,
    userId: q.userId!,
    content: q.content,
    answer: q.answer,
    tags: q.tags,
    difficulty: q.difficulty,
    sourceCompany: q.sourceCompany,
    reviewCount: q.reviewCount,
    nextReviewAt: q.nextReviewAt?.toISOString() ?? null,
    createdAt: q.createdAt?.toISOString() ?? null,
  };
}
