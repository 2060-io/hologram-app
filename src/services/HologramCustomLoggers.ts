/* eslint-disable no-console */
import { Logger, LogLevel } from '@credo-ts/core'

//Logs whose values are larger than this most probable are ciphertext or base64 of images
const MAX_LOG_SIZE = 10_000 // 0.01 MB

// A string longer than this is usually ciphertext, a base64 image or a long peer DID
const MAX_STRING_LENGTH = 160
const STRING_HEAD_LENGTH = 64
const STRING_TAIL_LENGTH = 12

function truncateLog(log: string): string {
  if (log.length <= MAX_LOG_SIZE) return log
  return log.substring(0, MAX_LOG_SIZE) + '... (Truncated)'
}

// Keeps the start and the end of a long string. The start of a did:peer:4 holds its short form.
function shortenString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value
  const head = value.substring(0, STRING_HEAD_LENGTH)
  const tail = value.substring(value.length - STRING_TAIL_LENGTH)
  return `${head}…${tail} (${value.length} chars)`
}

function describeCause(cause: unknown): string | undefined {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`
  return typeof cause === 'string' ? cause : undefined
}

function stringify(data: unknown): string {
  const ancestors: object[] = []
  try {
    return JSON.stringify(
      data,
      function (this: object, _key, value) {
        if (typeof value === 'string') return shortenString(value)
        if (value instanceof Error) {
          // An Error has no enumerable properties, and some errors hold the full outbound message
          const { cause } = value as Error & { cause?: unknown }
          return { name: value.name, message: value.message, cause: describeCause(cause) }
        }
        if (typeof value === 'object' && value !== null) {
          // `this` is the parent of the value: drop the ancestors that are not in the current path
          while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) ancestors.pop()
          if (ancestors.includes(value)) return '[Circular]'
          ancestors.push(value)
        }
        return value
      },
      __DEV__ ? '\t' : undefined
    )
  } catch (error) {
    return `[Unserializable data: ${error}]`
  }
}

export class HologramCustomLogger implements Logger {
  logLevel: LogLevel

  constructor(logLevel: LogLevel) {
    this.logLevel = logLevel
  }

  getOutput(data: Record<string, unknown>) {
    return __DEV__ ? stringify(data) : truncateLog(stringify(data))
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
      console.warn(`WARN: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  error(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Error >= this.logLevel) {
      console.error(`ERROR: ${message}`, data ? this.getOutput(data) : '')
    }
  }
  fatal(message: string, data?: Record<string, unknown>) {
    if (LogLevel.Fatal >= this.logLevel) {
      console.error(`FATAL: ${message}`, data ? this.getOutput(data) : '')
    }
  }
}
