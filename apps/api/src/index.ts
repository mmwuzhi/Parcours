import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { traceId } from './middleware/trace-id.js'
import { requestLogger } from './middleware/request-logger.js'
import { publicRateLimiter } from './middleware/rate-limiter.js'
import { authGuard } from './middleware/auth-guard.js'
import { userRateLimiter } from './middleware/rate-limiter.js'
import { authRoutes } from './routes/auth.js'
import { applicationRoutes } from './routes/applications.js'
import { interviewRoutes } from './routes/interviews.js'
import { questionRoutes } from './routes/questions.js'
import { watchlistRoutes } from './routes/watchlist.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { env } from './env.js'

type Variables = { traceId: string; user: { id: string; email: string } }

const app = new OpenAPIHono<{ Variables: Variables }>()

app.use('*', cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use('*', traceId)
app.use('*', requestLogger)
app.use('*', publicRateLimiter)

app.route('/api/auth', authRoutes)

const protected_ = new OpenAPIHono<{ Variables: Variables }>()
protected_.use('*', authGuard)
protected_.use('*', userRateLimiter)

protected_.route('/applications', applicationRoutes)
protected_.route('/applications', interviewRoutes)
protected_.route('/questions', questionRoutes)
protected_.route('/watchlist', watchlistRoutes)
protected_.route('/dashboard', dashboardRoutes)

app.route('/api', protected_)

app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Parcours API', version: '0.0.0' },
})

app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})

export default app
