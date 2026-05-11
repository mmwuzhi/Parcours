import type { MiddlewareHandler } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
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
  const count = results?.[2]?.[1];
  if (typeof count !== "number") return true;
  return count <= limit;
}

function getClientIp(c: Parameters<MiddlewareHandler>[0]): string {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

export const publicRateLimiter: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(c);

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
