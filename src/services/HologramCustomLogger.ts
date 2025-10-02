/* eslint-disable no-console */
import { Logger, LogLevel } from '@credo-ts/core'

export class HologramCustomLogger implements Logger {
  logLevel: LogLevel

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel
  }
  test(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.test >= this.logLevel) {
      console.debug(`TEST ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  trace(message: string, data?: Record<string, unknown>): void {
    if (LogLevel.trace >= this.logLevel) {
      console.trace(`TRACE: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  debug(message: string, data?: unknown): void {
    if (LogLevel.debug >= this.logLevel) {
      console.debug(`DEBUG: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  info(message: string, data?: unknown): void {
    if (LogLevel.info >= this.logLevel) {
      console.info(`INFO: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  warn(message: string, data?: unknown): void {
    if (LogLevel.warn >= this.logLevel) {
      console.warn(`WARN: ${message}`, data ? JSON.stringify(data) : '')
    }
  }
  error(message: string, data?: unknown): void {
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
