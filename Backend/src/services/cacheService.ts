import crypto from 'crypto'
import redis from '../config/redis.js'
import logger from '../utils/logger.js'

const CHAT_CACHE_VERSION = 'v2'

export function generateCacheKey(businessId: string, message: string, contextSeed = ''): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${CHAT_CACHE_VERSION}::${message.toLowerCase().trim()}::${contextSeed}`)
    .digest('hex')
    .slice(0, 16)
  return `chat:${businessId}:${hash}`
}

export async function getCached(key: string): Promise<string | null> {
  try {
    return await redis.get(key)
  } catch (err) {
    logger.error('Cache get error', { key, error: err instanceof Error ? err.message : String(err) })
    return null
  }
}

export async function setCached(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, value)
  } catch (err) {
    logger.error('Cache set error', { key, error: err instanceof Error ? err.message : String(err) })
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0'
    const keysToDelete: string[] = []

    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      keysToDelete.push(...keys)
    } while (cursor !== '0')

    if (keysToDelete.length === 0) return

    for (let i = 0; i < keysToDelete.length; i += 100) {
      const batch = keysToDelete.slice(i, i + 100)
      await redis.del(...batch)
    }

    logger.info(`Cache invalidated ${keysToDelete.length} keys matching pattern: ${pattern}`)
  } catch (err) {
    logger.error('Cache invalidate pattern error', {
      pattern,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  try {
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (err) {
    logger.error('Cache getOrSet read error', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  const result = await fetcher()

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(result))
  } catch (err) {
    logger.error('Cache getOrSet write error', {
      key,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return result
}
