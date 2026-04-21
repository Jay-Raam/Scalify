import { Redis } from 'ioredis'
import { env } from './env.js'
import logger from '../utils/logger.js'

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
})

redis.on('connect', () => {
  logger.info('Redis connected')
})

redis.on('error', (err: Error) => {
  logger.error('Redis error (non-fatal)', { error: err.message })
})

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...')
})

redis.on('ready', () => {
  logger.info('Redis ready')
})

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connect') return
  try {
    await redis.connect()
  } catch (err) {
    logger.error('Redis initial connection failed (non-fatal — continuing without cache)', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export default redis
