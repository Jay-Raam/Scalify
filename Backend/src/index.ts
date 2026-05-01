import 'dotenv/config'
import { env } from './config/env.js'
import logger, { morganStream } from './utils/logger.js'
import { connectDB } from './config/db.js'
import { connectRedis } from './config/redis.js'
import redis from './config/redis.js'
import { yoga } from './graphql/yoga.js'
import { generalLimiter, graphqlRateLimiter } from './middleware/rateLimiter.js'
import { authenticateToken } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import mongoose from 'mongoose'
import type { Server } from 'http'

const app = express()

// ─── Security & utility middleware ───────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
)

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  })
)

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined', { stream: morganStream }))

// Global rate limiter
app.use(generalLimiter)

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
    timestamp: new Date().toISOString(),
  })
})

app.use('/graphql', graphqlRateLimiter, authenticateToken, yoga)

// ─── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler)

// ─── Server startup ───────────────────────────────────────────────────────────
async function startServer(): Promise<Server> {
  await connectDB()
  await connectRedis()

  const server = app.listen(Number(env.PORT))

  server.keepAliveTimeout = 65000
  server.headersTimeout = 66000

  server.on('listening', () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
  })

  return server
}

let server: Server

try {
  server = await startServer()
} catch (err) {
  logger.error('Failed to start server', {
    error: err instanceof Error ? err.message : String(err),
  })
  process.exit(1)
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────
let isShuttingDown = false

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`${signal} received — shutting down gracefully`)

  server.close(async () => {
    try {
      await mongoose.connection.close()
      await redis.quit()
      logger.info('Shutdown complete')
      process.exit(0)
    } catch (err) {
      logger.error('Error during shutdown', {
        error: err instanceof Error ? err.message : String(err),
      })
      process.exit(1)
    }
  })

  setTimeout(() => {
    logger.error('Force shutdown — timeout exceeded')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
