import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload | string
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Allow GraphQL introspection without auth
  const body = req.body as Record<string, unknown> | undefined
  if (body?.query && typeof body.query === 'string' && body.query.includes('__schema')) {
    return next()
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return next()
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
