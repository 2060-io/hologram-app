export * from './log'

export const getFileSize = (byteCount: number) => {
  if (byteCount >= 1000000000) return `${(byteCount / 1000000000).toFixed(2)} GB`
  else if (byteCount > 1000000) return `${(byteCount / 1000000).toFixed(2)} MB`
  else if (byteCount > 1000) return `${byteCount / 1000} KB`
  else return `${byteCount} bytes`
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

export const dataUrl = (mime?: string, data?: string) => (data && mime ? `data:${mime};base64,${data}` : '')
