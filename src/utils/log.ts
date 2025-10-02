/* eslint-disable no-console */
import { DocumentDirectoryPath } from 'react-native-fs'

import { toast } from './toast'

export const LOGS_DIRECTORY = `${DocumentDirectoryPath}/hologramLogs`
export function log(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    console.log(message, ...optionalParams)
  }
}

export function logError(message: string, ...optionalParams: unknown[]) {
  console.error(message, ...optionalParams)
}

export function logWarn(message: string, displayToast = false) {
  if (displayToast) toast({ message, type: 'warning' })
  console.warn(message)
}
