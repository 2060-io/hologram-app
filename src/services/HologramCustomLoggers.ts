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

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel
  }

  getOutput(data: Record<string, unknown>) {
    return __DEV__ ? JSON.stringify(data, null, '\t') : truncateLog(JSON.stringify(data))
  }

  test(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Test >= this.logLevel) {
      console.debug(`TEST: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  trace(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Trace >= this.logLevel) {
      console.trace(`TRACE: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  debug(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Debug >= this.logLevel) {
      console.debug(`DEBUG: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  info(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Info >= this.logLevel) {
      console.info(`INFO: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  warn(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Warn >= this.logLevel) {
      console.warn(`WARN: ${message}`, data)
    }
  }
  error(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Error >= this.logLevel) {
      console.error(`ERROR: ${message}`, data)
    }
  }
  fatal(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Fatal >= this.logLevel) {
      console.error(`FATAL: ${message}`, data)
    }
  }
}
