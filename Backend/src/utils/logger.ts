import winston from 'winston'
import path from 'path'
import fs from 'fs'

const logsDir = path.resolve('logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const { combine, timestamp, printf, colorize, json, errors } = winston.format

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `${timestamp} [${level}]: ${message}\n${stack}`
      : `${timestamp} [${level}]: ${message}`
  })
)

const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
)

const logger = winston.createLogger({
  level: 'http',
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
})

export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
}

export default logger
