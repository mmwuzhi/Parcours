import pino from "pino";
import pretty from "pino-pretty";
import type { MiddlewareHandler } from "hono";
import { env } from "../env.js";

// `transport: { target: "pino-pretty" }` spawns a thread-stream worker which
// crashes on Node 26+ (thread-stream@4.0.0 bug). Use pino-pretty as a
// synchronous stream instead — no worker thread, no version dependency.
export const logger =
  env.NODE_ENV === "development" ? pino(pretty({ colorize: true })) : pino();

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  logger.info({ method, path }, "request");

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  const traceId = c.get("traceId");

  logger.info({ method, path, status, duration, traceId }, "response");
};
