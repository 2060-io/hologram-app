import dayjs, { extend } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isYesterday from 'dayjs/plugin/isYesterday'
import { t } from 'i18next'

extend(isYesterday)
extend(customParseFormat)
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
 * Function that returns if now is after than given date
 *
 * @param {Date} date
 * @returns boolean
 */
export const isNowAfterThanDate = (timestamp: number): boolean => {
  const givenDate = dayjs(new Date(timestamp))
  const currentDate = dayjs()
  return currentDate.isAfter(givenDate)
}

/**
 * Format string date in format 'YYYYMMDD' to string date in format 'DD-MM-YYYY'
 *
 * @param {string} stringDate
 * @returns string containing the formatted date
 */
export const stringToStringDate = (stringDate: string) => {
  return dayjs(stringDate, 'YYYYMMDD').format('DD-MM-YYYY')
}

/**
 * Receives a string date in format 'DD-MM-YYYY' and returns a number
 * indicating how many years have passed until today
 * @param {string} stringDate
 * @returns number
 */
export const timeFromNow = (stringDate: string) => {
  const years = dayjs().diff(dayjs(stringDate, 'DD-MM-YYYY'), 'year')
  return years
}

/**
 * Receives a string date in format of stringDateFormat and convert it to Date object
 * @param stringDate
 * @param stringDateFormat
 * @returns Date
 */
export const stringToDate = (stringDate: string, stringDateFormat: string) => {
  return dayjs(stringDate, stringDateFormat).toDate()
}

/**
 * Converts a given date to a formatted string using dayjs.
 *
 * @param date - The date to format. Can be a Date object, a timestamp (number), or undefined.
 * @param format - An optional format string compatible with dayjs.
 * If not provided, dayjs's default format is used.
 * @returns The formatted date string.
 */
export const dateToString = (date: Date | number | undefined, format?: string) => {
  return dayjs(date).format(format)
}

/**
 * Checks if two dates are the same day.
 *
 * @param date1 - The first date to compare. Can be a Date object, a timestamp (number)
 * @param date2 - The second date to compare. Can be a Date object, a timestamp (number)
 * @returns true if both dates are the same day, false otherwise.
 */
export function getIsSameDay(date1: Date | number, date2: Date | number) {
  const firstDate = dayjs(date1)
  const secondDate = dayjs(date2)
  if (!firstDate.isValid() || !secondDate.isValid()) {
    return false
  }
  return firstDate.isSame(secondDate, 'day')
}
