/* eslint-disable no-console */
import { DocumentDirectoryPath } from 'react-native-fs'

import { toast } from './toast'

import { DEVELOPER_MODE_ENABLED_PERSIST_KEY, getStorageData } from '@2060/services/localStorage'

let isDeveloperMode = false
;(async function () {
  isDeveloperMode = Boolean(await getStorageData(DEVELOPER_MODE_ENABLED_PERSIST_KEY))
})()

export const LOGS_DIRECTORY = `${DocumentDirectoryPath}/hologramLogs`
export function log(message: string, ...optionalParams: unknown[]) {
  if (__DEV__ || isDeveloperMode) {
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
