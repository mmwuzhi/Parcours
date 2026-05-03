import type { MiddlewareHandler } from 'hono'

declare module 'hono' {
  interface ContextVariableMap {
    traceId: string
    user: { id: string; email: string }
  }
}

export const traceId: MiddlewareHandler = async (c, next) => {
  const id = c.req.header('X-Trace-Id') ?? crypto.randomUUID()
  c.set('traceId', id)
  c.header('X-Trace-Id', id)
  await next()
}
