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

  getOutput(data: Record<string, unknown>) {
    if (this.isDevelopment) return JSON.stringify(data, null, '\t')
    return truncateLog(JSON.stringify(data))
  }

  test(message: string, data?: Record<string, unknown>) {
    if (LogLevel.test >= this.logLevel) {
      console.debug(`TEST: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  trace(message: string, data?: Record<string, unknown>) {
    if (LogLevel.trace >= this.logLevel) {
      console.trace(`TRACE: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  debug(message: string, data?: Record<string, unknown>) {
    if (LogLevel.debug >= this.logLevel) {
      console.debug(`DEBUG: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  info(message: string, data?: Record<string, unknown>) {
    if (LogLevel.info >= this.logLevel) {
      console.info(`INFO: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  warn(message: string, data?: Record<string, unknown>) {
    if (LogLevel.warn >= this.logLevel) {
      console.warn(`WARN: ${message}`, data ? JSON.stringify(data, null, '\t') : '')
    }
  }
  error(message: string, data?: Record<string, unknown>) {
    if (LogLevel.error >= this.logLevel) {
      console.error(`ERROR: ${message}`, data ? JSON.stringify(data, null, '\t') : '')
    }
  }
  fatal(message: string, data?: Record<string, unknown>) {
    if (LogLevel.fatal >= this.logLevel) {
      console.error(`FATAL: ${message}`, data ? JSON.stringify(data, null, '\t') : '')
    }
  }
}

export class HologramCustomLoggerForProd extends HologramCustomLogger {
  isDeveloperMode: boolean

  constructor(logLevel: LogLevel, isDeveloperMode: boolean) {
    super(logLevel)
    this.isDeveloperMode = isDeveloperMode
  }

  test(message: string, data?: Record<string, unknown>) {
    if (this.isDeveloperMode) super.test(message, data)
  }
  trace(message: string, data?: Record<string, unknown>) {
    if (this.isDeveloperMode) super.trace(message, data)
  }
  debug(message: string, data?: Record<string, unknown>) {
    if (this.isDeveloperMode) super.debug(message, data)
  }
  info(message: string, data?: Record<string, unknown>) {
    if (this.isDeveloperMode) super.info(message, data)
  }
}
