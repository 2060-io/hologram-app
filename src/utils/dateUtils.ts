import dayjs, { extend } from 'dayjs'
import isYesterday from 'dayjs/plugin/isYesterday'
import { t } from 'i18next'

extend(isYesterday)
import { language } from './language'

import { capitalizeFirstLetter } from './index'

/**
 * Format date for general usage (mostly Chat list)
 *
 * @param {Date} date
 * @returns string containing the formatted day
 */
export const chatDateFormat = (date: Date, is24HourFormat: boolean): string => {
  const givenDate = dayjs(date)
  const currentDate = dayjs()
  const messageWasSentToday = givenDate.isSame(currentDate, 'day')
  if (messageWasSentToday) {
    return givenDate.format(language === 'fr' ? 'LT' : is24HourFormat ? 'HH:mm' : 'h:mm A')
  }
  if (givenDate.isYesterday()) return t('yesterday')
  const diffDays = dayjs(currentDate.format('YYYY-MM-DD')).diff(dayjs(givenDate.format('YYYY-MM-DD')), 'day')
  const messageWasSentLastWeek = diffDays > 1 && diffDays < 7
  if (messageWasSentLastWeek) return capitalizeFirstLetter(givenDate.format('dddd'))
  return givenDate.format('L')
}

export const getFormattedDateRange = (date: Date) => {
  const givenDate = dayjs(date)
  const currentDate = dayjs()
  const isSameDay = givenDate.isSame(currentDate, 'day')
  if (isSameDay) return t('today')
  if (givenDate.isYesterday()) return t('yesterday')
  const diffDays = dayjs(currentDate.format('YYYY-MM-DD')).diff(dayjs(givenDate.format('YYYY-MM-DD')), 'day')
  const isFromLastWeek = diffDays > 1 && diffDays < 7
  if (isFromLastWeek) return capitalizeFirstLetter(givenDate.format('dddd'))
  return givenDate.format('L')
}

export const getFormattedDateRangeWithTime = (date: Date, is24HourFormat: boolean): string => {
  const time = dayjs(date).format(language === 'fr' ? 'LT' : is24HourFormat ? 'HH:mm' : 'h:mm A')
  return `${getFormattedDateRange(date)} ${time}`
}
/**
 * Format date using template YYYY-MM-DD @ HH:mm [GMT] Z
 *
 * @param {Date} date
 * @returns string containing the formatted dates
 */
export const getDateTimeFormatString = (date: Date): string => {
  const dateTimeFormatString = 'YYYY-MM-DD @ HH:mm [GMT] Z'
  return dayjs(date).format(dateTimeFormatString)
}
