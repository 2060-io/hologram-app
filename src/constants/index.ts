import { Platform } from 'react-native'

import { hexTransparency, lightenDarken } from '../utils/colorUtils'

// region Styles ---------------------------------------------------------------------------------------------
export const whiteColor = '#FFFFFF'
export const primaryColor = '#7678EC'
export const secondaryColor = '#fdab38'
export const redColor = '#FF0000'
export const mainTextColor = '#000000'
export const grayColor = '#727272'
export const waterColor = (value: string) => hexTransparency(lightenDarken(value, 60), '20')
export const AUDIO_WAVEFORM_NUMBER_OF_CANDLES = 30
export const IS_DEVICE_IOS = Platform.OS === 'ios'

export const isAndroid13OrHigher = () => {
  if (Platform.OS === 'android') {
    return Platform.Version >= 33
  }
  return false
}
