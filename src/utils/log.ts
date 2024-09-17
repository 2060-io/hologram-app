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
}

export function logWarn(message: string, ...optionalParams: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(message, ...optionalParams)
  }
}
