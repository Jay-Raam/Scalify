import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import logger from '../utils/logger.js'

interface AppError extends Error {
  status?: number
  code?: number
  errors?: Record<string, { message: string }>
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  })

  if (err.name === 'ValidationError' && err.errors) {
    res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message),
    })
    return
  }

  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' })
    return
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(409).json({ error: 'Duplicate entry' })
    return
  }

  res.status(500).json({
    error:
      env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}
