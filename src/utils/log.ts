/* eslint-disable no-console */
import { DocumentDirectoryPath } from 'react-native-fs'

import { toast } from './toast'

export const LOGS_DIRECTORY = `${DocumentDirectoryPath}/hologramLogs`

/**
 * Logs an important application message visible in both development and production.
 */
export function logForProd(message: string, ...optionalParams: unknown[]) {
  console.log(`APP_DEBUG: ${message}`, ...optionalParams)
}

export function log(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    console.log(`APP_DEBUG: ${message}`, ...optionalParams)
  }
}

export function logError(message: string, ...optionalParams: unknown[]) {
  console.error(`APP_ERROR: ${message}`, ...optionalParams)
}

export function logWarn(message: string, displayToast = false) {
  if (displayToast) toast({ message, type: 'warning' })
  console.warn(`APP_WARN: ${message}`)
}
