/* eslint-disable no-console */
import { Logger, LogLevel } from '@credo-ts/core'

//Logs whose values are larger than this most probable are ciphertext or base64 of images
const MAX_LOG_SIZE = 10_000 // 0.01 MB

function truncateLog(log: string): string {
  if (log.length <= MAX_LOG_SIZE) return log
  return log.substring(0, MAX_LOG_SIZE) + '... (Truncated)'
}

export class HologramCustomLogger implements Logger {
  logLevel: LogLevel
  isDevelopment = __DEV__

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel
  }

  test(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.test >= this.logLevel) {
      const extraInfo = this.isDevelopment ? JSON.stringify(data) : truncateLog(JSON.stringify(data))
      console.debug(`TEST ${message}`, extraInfo)
    }
  }
  trace(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.trace >= this.logLevel) {
      const extraInfo = this.isDevelopment ? JSON.stringify(data) : truncateLog(JSON.stringify(data))
      console.trace(`TRACE: ${message}`, extraInfo)
    }
  }
  debug(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.debug >= this.logLevel) {
      const extraInfo = this.isDevelopment ? JSON.stringify(data) : truncateLog(JSON.stringify(data))
      console.debug(`DEBUG: ${message}`, extraInfo)
    }
  }
  info(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.info >= this.logLevel) {
      const extraInfo = this.isDevelopment ? JSON.stringify(data) : truncateLog(JSON.stringify(data))
      console.info(`INFO: ${message}`, extraInfo)
    }
  }
  warn(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.warn >= this.logLevel) {
      console.warn(`WARN: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  error(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.error >= this.logLevel) {
      console.error(`ERROR: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  fatal(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.fatal >= this.logLevel) {
      console.error(`FATAL: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
}
