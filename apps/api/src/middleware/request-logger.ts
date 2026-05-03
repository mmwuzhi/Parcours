import pino from 'pino'
import type { MiddlewareHandler } from 'hono'
import { env } from '../env.js'

export const logger = pino(
  env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : {},
)

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path

  logger.info({ method, path }, 'request')

  await next()

  const duration = Date.now() - start
  const status = c.res.status
  const traceId = c.get('traceId')

  logger.info({ method, path, status, duration, traceId }, 'response')
}
