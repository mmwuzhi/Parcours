import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  AI_PROVIDER: z
    .enum(['openai', 'anthropic', 'google', 'groq', 'mistral', 'deepseek'])
    .default('openai'),
  AI_API_KEY: z.string(),
  AI_MODEL: z.string(),
  AI_BASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
