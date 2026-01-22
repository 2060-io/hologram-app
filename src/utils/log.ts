/* eslint-disable no-console */
import { DocumentDirectoryPath } from 'react-native-fs'

import { getAreLogsEnabled } from './developer'
import { toast } from './toast'

let areLogsEnabled = false
;(async function () {
  areLogsEnabled = await getAreLogsEnabled()
})()

export const LOGS_DIRECTORY = `${DocumentDirectoryPath}/hologramLogs`
export function log(message: string, ...optionalParams: unknown[]) {
  if (__DEV__ || areLogsEnabled) {
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
