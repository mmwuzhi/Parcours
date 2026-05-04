import type { MiddlewareHandler } from "hono";
import { redis } from "../lib/redis.js";
import { logger } from "./request-logger.js";

async function slidingWindow(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, "-inf", windowStart);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.zcard(key);
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();
  if (!results) return true;

  const count = results[2]?.[1] as number;
  return count <= limit;
}

export const publicRateLimiter: MiddlewareHandler = async (c, next) => {
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown";

  try {
    const allowed = await slidingWindow(`rl:ip:${ip}`, 60, 60_000);
    if (!allowed) {
      return c.json({ error: "Too Many Requests" }, 429);
    }
  } catch (err) {
    logger.warn({ err }, "rate limiter redis error — degrading gracefully");
  }

  await next();
};

export const userRateLimiter: MiddlewareHandler = async (c, next) => {
  const user = c.get("user");
  const userId = user?.id ?? "anonymous";

  try {
    const allowed = await slidingWindow(`rl:user:${userId}`, 300, 60_000);
    if (!allowed) {
      return c.json({ error: "Too Many Requests" }, 429);
    }
  } catch (err) {
    logger.warn({ err }, "rate limiter redis error — degrading gracefully");
  }

  await next();
};
