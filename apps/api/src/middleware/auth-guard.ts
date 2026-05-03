import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyAccessToken } from '../lib/jwt.js'

export const authGuard: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, 'access_token')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = verifyAccessToken(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
