import crashlytics from '@react-native-firebase/crashlytics'

export function log(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(message, ...optionalParams)
  }
}

export function logError(message: string, ...optionalParams: unknown[]) {
  const completeErrorMessage = message + optionalParams.map(param => JSON.stringify(param)).join(' ')
  crashlytics().recordError(new Error(completeErrorMessage))
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(message, ...optionalParams)
  }
}

export function logWarn(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(message, ...optionalParams)
  }
}
