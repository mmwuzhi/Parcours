import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { traceId } from "../middleware/trace-id.js";
import { publicRateLimiter } from "../middleware/rate-limiter.js";
import { authGuard } from "../middleware/auth-guard.js";
import { userRateLimiter } from "../middleware/rate-limiter.js";
import { authRoutes } from "../routes/auth.js";
import { applicationRoutes } from "../routes/applications.js";
import { interviewRoutes } from "../routes/interviews.js";
import { questionRoutes } from "../routes/questions.js";
import { watchlistRoutes } from "../routes/watchlist.js";
import { dashboardRoutes } from "../routes/dashboard.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

type Variables = { traceId: string; user: { id: string; email: string } };

export function createApp() {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  app.use("*", cors({ origin: "http://localhost:3000", credentials: true }));
  app.use("*", traceId);
  app.use("*", publicRateLimiter);

  app.route("/api/auth", authRoutes);

  const protected_ = new OpenAPIHono<{ Variables: Variables }>();
  protected_.use("*", authGuard);
  protected_.use("*", userRateLimiter);

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
  await db.delete(users).where(eq(users.email, email));
}

let _counter = 0;
export function uniqueEmail(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${++_counter}@parcours.test`;
}
