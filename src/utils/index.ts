export * from './log'

const ONE_BILLION = 1_000_000_000
const ONE_MILLION = 1_000_000
const ONE_THOUSAND = 1_000

export const getFileSize = (byteCount: number) => {
  if (byteCount >= ONE_BILLION) return `${(byteCount / ONE_BILLION).toFixed(2)} GB`
  else if (byteCount > ONE_MILLION) return `${(byteCount / ONE_MILLION).toFixed(2)} MB`
  else if (byteCount > ONE_THOUSAND) return `${byteCount / ONE_THOUSAND} KB`
  else return `${byteCount} bytes`
}

export const capitalizeFirstLetter = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export const getFlagEmoji = (countryCode: string) => {
  return countryCode.toUpperCase().replace(/./g, (char: string) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

export const trimText = (text: string, limit?: number) => {
  const maxLength = limit ?? 50

  let result = text.substring(0, 50)
  if (maxLength < text.length) result = result + '…'

  return result
}

export const dataUrl = (mime?: string, data?: string) => (data && mime ? `data:${mime};base64,${data}` : '')
