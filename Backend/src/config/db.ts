import mongoose from 'mongoose'
import { env } from './env.js'
import logger from '../utils/logger.js'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

export async function connectDB(): Promise<void> {
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      logger.info(`MongoDB connected: ${mongoose.connection.host}`)

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected')
      })

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message })
      })

      return
    } catch (err) {
      attempt++
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1)
      logger.warn(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`,
        { error: err instanceof Error ? err.message : String(err) }
      )

      if (attempt >= MAX_RETRIES) {
        logger.error('MongoDB connection failed after maximum retries. Exiting.')
        process.exit(1)
      }

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
