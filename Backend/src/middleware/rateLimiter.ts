import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import type { Request, Response, NextFunction } from 'express'
import redis from '../config/redis.js'
import logger from '../utils/logger.js'

function makeRedisStore(prefix: string) {
  return new RedisStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendCommand: (...args: string[]) => (redis as any).call(...args),
    prefix,
  })
}

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:general:'),
  handler: (_req: Request, res: Response) => {
    logger.warn('Rate limit exceeded — general')
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: res.getHeader('Retry-After'),
    })
  },
})

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:chat:'),
  handler: (_req: Request, res: Response) => {
    logger.warn('Rate limit exceeded — chat')
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: res.getHeader('Retry-After'),
    })
  },
})

function parseOperationName(body: Record<string, unknown>): string | null {
  if (body.operationName && typeof body.operationName === 'string') {
    return body.operationName
  }
  if (body.query && typeof body.query === 'string') {
    const match = (body.query as string).match(
      /(?:mutation|query)\s+(\w+)/i
    )
    return match?.[1] ?? null
  }
  return null
}

export function graphqlRateLimiter(req: Request, res: Response, next: NextFunction) {
  const body = req.body as Record<string, unknown> | undefined
  const operationName = body ? parseOperationName(body) : null

  const chatOps = new Set(['SendMessage'])

  if (operationName && chatOps.has(operationName)) {
    return chatLimiter(req, res, next)
  }

  return generalLimiter(req, res, next)
}
