import { utils } from '@credo-ts/core'

import { dateToString } from '@2060/utils/dateUtils'

/**
 * Generates an unique file name, based on the media type (used for name prefix)
 * and the desired file extension. If no file extension is specified, it will take it from
 * the media subtype
 * @param mimeType media type of the file
 * @param extension optional file extension for the generated file name
 * @returns generated file name
 */
export function generateFileName(mimeType: string, extension?: string) {
  const [year, month, day] = dateToString(new Date(), 'YYYY/MM/DD').split('/')
  const uid = utils.uuid().slice(0, 6).toUpperCase()

  const [mainType, subType] = mimeType.split('/')

  let prefix = 'FILE'
  if (mainType === 'audio') prefix = 'AUD'
  if (mainType === 'image') prefix = 'IMG'
  if (mainType === 'video') prefix = 'VID'

  return `${prefix}-${year}${month}${day}-${uid}.${extension ?? subType}`
}
