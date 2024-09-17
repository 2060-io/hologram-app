import { Dimensions, PixelRatio } from 'react-native'

export const screenWidth = Dimensions.get('window').width
export const screenHeight = Dimensions.get('window').height

/**
 * Parse string percentage input and convert it to number.
 * @param {string | number} percent The percent value to convert
 */
const toFloat = (percent: string | number) => (typeof percent === 'number' ? percent : parseFloat(percent))

/**
 * Converts provided width percentage to density-independent pixel (dp).
 * @param  {string} widthPercent The percentage of screen's width that UI element should cover
 * along with the percentage symbol (%).
 * @return {number} The calculated dp depending on current device's screen width.
 */
export const widthPercentageToDP = (widthPercent: string) => {
  const calcPercent = (screenWidth * toFloat(widthPercent)) / 100
  return PixelRatio.roundToNearestPixel(calcPercent)
}

/**
 * Converts provided height percentage to density-independent pixel (dp).
 * @param  {string} heightPercent The percentage of screen's height that UI element should cover
 * along with the percentage symbol (%).
 * @return {number} The calculated dp depending on current device's screen height.
 */
export const heightPercentageToDP = (heightPercent: string) => {
  const calcPercent = (screenHeight * toFloat(heightPercent)) / 100
  return PixelRatio.roundToNearestPixel(calcPercent)
}
