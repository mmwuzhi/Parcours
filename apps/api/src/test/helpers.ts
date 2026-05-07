import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { traceId } from "../middleware/trace-id.js";
import { authGuard } from "../middleware/auth-guard.js";
import { authRoutes } from "../routes/auth.js";
import { applicationRoutes } from "../routes/applications.js";
import { interviewRoutes } from "../routes/interviews.js";
import { questionRoutes } from "../routes/questions.js";
import { watchlistRoutes } from "../routes/watchlist.js";
import { dashboardRoutes } from "../routes/dashboard.js";
import { db } from "../db/index.js";
import {
  users,
  applications,
  applicationQuestions,
  interviews,
  questions,
  watchlist,
} from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";
// Rate limiters intentionally omitted — they're infrastructure, not business logic,
// and cause 429s when test suites share an IP in CI.

type Variables = { traceId: string; user: { id: string; email: string } };

export function createApp() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  app.use("*", cors({ origin: "http://localhost:3000", credentials: true }));
  app.use("*", traceId);

  app.route("/api/auth", authRoutes);

  const protected_ = new OpenAPIHono<{ Variables: Variables }>();
  protected_.use("*", authGuard);

  protected_.route("/applications", applicationRoutes);
  protected_.route("/applications", interviewRoutes);
  protected_.route("/questions", questionRoutes);
  protected_.route("/watchlist", watchlistRoutes);
  protected_.route("/dashboard", dashboardRoutes);

  app.route("/api", protected_);
  return app;
}

export type TestApp = ReturnType<typeof createApp>;

export async function registerAndLogin(
  app: TestApp,
  email: string,
  password = "Test1234!",
): Promise<string> {
  await app.request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const res = await app.request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

export function authed(
  app: TestApp,
  cookies: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return Promise.resolve(
    app.request(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
        ...(init.headers as Record<string, string>),
      },
    }),
  );
}

export async function cleanupUser(email: string): Promise<void> {
  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!found.length) return;
  const userId = found[0].id;

  const userApps = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.userId, userId));
  const appIds = userApps.map((a) => a.id);

  if (appIds.length) {
    await db
      .delete(applicationQuestions)
      .where(inArray(applicationQuestions.applicationId, appIds));
    await db
      .delete(interviews)
      .where(inArray(interviews.applicationId, appIds));
    await db.delete(applications).where(inArray(applications.id, appIds));
  }
  await db.delete(questions).where(eq(questions.userId, userId));
  await db.delete(watchlist).where(eq(watchlist.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}

let _counter = 0;
export function uniqueEmail(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${++_counter}@parcours.test`;
}
