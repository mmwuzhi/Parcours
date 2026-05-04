import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword } from "../lib/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { env } from "../env.js";
import { RegisterSchema, LoginSchema } from "@parcours/shared";

type Variables = { traceId: string; user: { id: string; email: string } };

export const authRoutes = new OpenAPIHono<{ Variables: Variables }>();

const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  request: {
    body: {
      content: { "application/json": { schema: RegisterSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({
            user: z.object({ id: z.string(), email: z.string() }),
          }),
        },
      },
      description: "User registered",
    },
    409: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Email already in use",
    },
  },
});

authRoutes.openapi(registerRoute, async (c) => {
  const { email, password } = c.req.valid("json");
  const passwordHash = await hashPassword(password);

  try {
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({
        id: users.id,
        email: users.email,
      });

    const accessToken = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id });

    setCookie(c, "access_token", accessToken, cookieOptions);
    setCookie(c, "refresh_token", refreshToken, {
      ...cookieOptions,
      path: "/api/auth/refresh",
    });

    return c.json({ user: { id: user.id, email: user.email } }, 201);
  } catch (err: unknown) {
    if (isPostgresError(err) && err.code === "23505") {
      return c.json({ error: "Email already in use" }, 409);
    }
    throw err;
  }
});

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  request: {
    body: {
      content: { "application/json": { schema: LoginSchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            user: z.object({ id: z.string(), email: z.string() }),
          }),
        },
      },
      description: "Logged in",
    },
    401: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Invalid credentials",
    },
  },
});

authRoutes.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid("json");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email });
  const refreshToken = signRefreshToken({ id: user.id });

  setCookie(c, "access_token", accessToken, cookieOptions);
  setCookie(c, "refresh_token", refreshToken, {
    ...cookieOptions,
    path: "/api/auth/refresh",
  });

  return c.json({ user: { id: user.id, email: user.email } }, 200);
});

const refreshRoute = createRoute({
  method: "post",
  path: "/refresh",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ ok: z.boolean() }) },
      },
      description: "Tokens rotated",
    },
    401: {
      content: {
        "application/json": { schema: z.object({ error: z.string() }) },
      },
      description: "Invalid refresh token",
    },
  },
});

authRoutes.openapi(refreshRoute, async (c) => {
  const token = getCookie(c, "refresh_token");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { id } = verifyRefreshToken(token);

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id });

    setCookie(c, "access_token", accessToken, cookieOptions);
    setCookie(c, "refresh_token", refreshToken, {
      ...cookieOptions,
      path: "/api/auth/refresh",
    });

    return c.json({ ok: true as const }, 200);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

const logoutRoute = createRoute({
  method: "delete",
  path: "/logout",
  responses: {
    204: { description: "Logged out" },
  },
});

authRoutes.openapi(logoutRoute, (c) => {
  deleteCookie(c, "access_token", { path: "/" });
  deleteCookie(c, "refresh_token", { path: "/api/auth/refresh" });
  return c.body(null, 204);
});

function isPostgresError(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}
