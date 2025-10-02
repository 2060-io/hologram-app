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
  isDevelopment: boolean

  constructor(logLevel: LogLevel, isDevelopment: boolean) {
    this.logLevel = logLevel
    this.isDevelopment = isDevelopment
  }

  test(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.test >= this.logLevel) {
      if (this.isDevelopment) {
        console.debug(`TEST ${message}`, data ? JSON.stringify(data) : '')
      } else {
        console.debug(`TEST ${message}`, data ? truncateLog(JSON.stringify(data)) : '')
      }
    }
  }
  trace(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.trace >= this.logLevel) {
      if (this.isDevelopment) {
        console.trace(`TRACE: ${message}`, data ? JSON.stringify(data) : '')
      } else {
        console.trace(`TRACE ${message}`, data ? truncateLog(JSON.stringify(data)) : '')
      }
    }
  }
  debug(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.debug >= this.logLevel) {
      if (this.isDevelopment) {
        console.debug(`DEBUG: ${message}`, data ? JSON.stringify(data) : '')
      } else {
        console.debug(`DEBUG: ${message}`, data ? truncateLog(JSON.stringify(data)) : '')
      }
    }
  }
  info(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.info >= this.logLevel) {
      if (this.isDevelopment) {
        console.info(`INFO: ${message}`, data ? JSON.stringify(data) : '')
      } else {
        console.info(`INFO: ${message}`, data ? truncateLog(JSON.stringify(data)) : '')
      }
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
