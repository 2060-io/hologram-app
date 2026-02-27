import dayjs, { extend, OpUnitType, QUnitType } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isYesterday from 'dayjs/plugin/isYesterday'
import { t } from 'i18next'

extend(isYesterday)
extend(customParseFormat)
import { language } from './language'

import { capitalizeFirstLetter } from './index'

type DateType = string | number | Date | dayjs.Dayjs

/**
 * Format date for general usage (mostly Chat list)
 *
 * @param date - Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @returns `string` containing the formatted day
 */
export const chatDateFormat = (date: DateType, is24HourFormat: boolean): string => {
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

export const getFormattedDateRange = (date: DateType) => {
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

export const getFormattedDateRangeWithTime = (date: DateType, is24HourFormat: boolean): string => {
  const time = dayjs(date).format(language === 'fr' ? 'LT' : is24HourFormat ? 'HH:mm' : 'h:mm A')
  return `${getFormattedDateRange(date)} ${time}`
}

/**
 * Function that returns if now is after than given date
 *
 * @param date - Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @returns `boolean`
 */
export const isNowAfterThanDate = (date: DateType): boolean => {
  const currentDate = dayjs()
  return isDateGreaterThan(currentDate, date)
}

/**
 * Format string date in format 'YYYYMMDD' to string date in format 'DD-MM-YYYY'
 *
 * @param stringDate
 * @returns `string` containing the formatted date
 */
export const stringToStringDate = (stringDate: string) => {
  return dayjs(stringDate, 'YYYYMMDD').format('DD-MM-YYYY')
}

/**
 * Calculates the difference between the current time and a given date in the specified unit.
 *
 * @param date - Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @param unit - The unit of time to use for the difference calculation (e.g., 'day', 'hour', 'minute').
 * @returns The difference between now and the provided date in the specified unit.
 */
export const timeFromNow = (date: DateType, unit: QUnitType | OpUnitType) => {
  const diff = dayjs().diff(dayjs(date), unit)
  return diff
}

/**
 * Converts a date string to a JavaScript `Date` object using the specified format.
 *
 * @param stringDate - The date string to convert.
 * @param format - (Optional) The format to parse the date string. Uses dayjs formatting options.
 * @returns A JavaScript `Date` object representing the parsed date.
 */
export const stringToDate = (stringDate: string, format?: dayjs.OptionType) => {
  return dayjs(stringDate, format).toDate()
}

/**
 * Converts a given date to a formatted string using dayjs.
 *
 * @param date - Can be a string, number, Date object, or a dayjs.Dayjs instance
 * @param format - An optional format string compatible with dayjs.
 * If not provided, dayjs's default format is used.
 * @returns The formatted date string.
 */
export const dateToString = (date: DateType, format?: string) => {
  return dayjs(date).format(format)
}

/**
 * Determines whether two dates fall on the same calendar day.
 *
 * @param date1 - The first date to compare. Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @param date2 - The second date to compare. Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @returns `true` if both dates are valid and represent the same day, otherwise `false`.
 */

export const getIsSameDay = (date1: DateType, date2: DateType) => {
  const firstDate = dayjs(date1)
  const secondDate = dayjs(date2)
  if (!firstDate.isValid() || !secondDate.isValid()) {
    return false
  }
  return firstDate.isSame(secondDate, 'day')
}

/**
 * Determines whether the first date is greater than (after) the second date.
 *
 * @param date1 - The first date to compare. Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @param date2 - The second date to compare. Can be a string, number, Date object, or a dayjs.Dayjs instance.
 * @returns `true` if `date1` is after `date2`, otherwise `false`.
 */
export const isDateGreaterThan = (date1: DateType, date2: DateType) => {
  const firstDate = dayjs(date1)
  const secondDate = dayjs(date2)
  return firstDate.isAfter(secondDate)
}

/**
 * Determines whether a given timestamp is older than 24 hours from the current time.
 *
 * @param timestamp - A timestamp in milliseconds representing a past date and time.
 * @returns `true` if the difference between now and the provided timestamp is greater than or
 * equal to 24 hours (in milliseconds), otherwise `false`.
 */
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000 // 86400000 ms
export const isOlderThan24Hours = (timestamp: number): boolean => {
  return new Date().getTime() - timestamp >= TWENTY_FOUR_HOURS_MS
}
