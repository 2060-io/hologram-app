import RNFS from 'react-native-fs'

import { LOG_FILE_PATH } from './RNFS'
import { toast } from './toast'

export function log(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(message, ...optionalParams)
  }
}

export function logError(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(message, ...optionalParams)
  }
  writeLog('ERROR', `${message} ${JSON.stringify(optionalParams)}`)
}

export function logWarn(message: string, displayToast = false) {
  if (displayToast) toast({ message, type: 'warning' })
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(message)
  }
  writeLog('WARNING', message)
}

/**
 * Appends a log entry to the local log file.
 * @param {string} level Log level
 * @param {string} message The log message.
 */
const writeLog = (level: string, message: string) => {
  const timestamp = new Date().toISOString()
  const logEntry = `${level}: ${timestamp}: ${message} \n`
  RNFS.appendFile(LOG_FILE_PATH, logEntry, 'utf8').catch(error => {
    log(error)
  })
}
