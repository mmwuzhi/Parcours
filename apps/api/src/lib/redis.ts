import Redis from 'ioredis'
import { env } from '../env.js'

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
})

redis.on('error', (err) => {
  // log but don't crash — rate limiter and cache degrade gracefully
  console.error('[redis] connection error', err)
})
