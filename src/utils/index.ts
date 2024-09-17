import { PermissionsAndroid, Permission } from 'react-native'

import { logWarn } from './log'

export * from './log'

export const getFileSize = (byteCount: number) => {
  if (byteCount >= 1000000000) return `${(byteCount / 1000000000).toFixed(2)} GB`
  else if (byteCount > 1000000) return `${(byteCount / 1000000).toFixed(2)} MB`
  else if (byteCount > 1000) return `${byteCount / 1000} KB`
  else return `${byteCount} bytes`
}

export const requestAndroidPermissions = async (permissions: Permission | Permission[]) => {
  const isRequestMultiplePermissions = Array.isArray(permissions)
  const { RESULTS } = PermissionsAndroid
  let permissionsResult: boolean = false

  try {
    if (isRequestMultiplePermissions) {
      const grants = await PermissionsAndroid.requestMultiple(permissions)
      permissionsResult = permissions.every(permission => grants[permission] === RESULTS.GRANTED)
    }

    if (!isRequestMultiplePermissions) {
      const status = await PermissionsAndroid.request(permissions as Permission)
      permissionsResult = status === RESULTS.GRANTED
    }
  } catch (error) {
    permissionsResult = false
    logWarn(error as string)
  }

  return permissionsResult
}

export const getNameInitials = (fullName: string) => {
  const nameParts = fullName.trim().split(' ')
  const firstName = nameParts[0]?.[0] || ''
  const lastName = nameParts[1]?.[0] || ''

  return (firstName + lastName).toUpperCase()
}

export const difference = <T>(arr1: T[], arr2: T[]): T[] => arr1.filter(x => !arr2.includes(x))

export const union = <T>(arr: T[], ...args: T[][]): T[] => [...new Set(arr.concat(...args))]

export const extractDomainFromUrl = (url: string) => {
  const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([^/]+)/
  const matches = url.match(domainRegex)
  return matches ? matches[1] : null
}

export const capitalizeFirstLetter = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export const getFlagEmoji = (countryCode: string) => {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

export const trimText = (text: string, limit?: number) => {
  const maxLength = limit ?? 50

  let result = text.substring(0, 50)
  if (maxLength < text.length) result = result + '…'

  return result
}
