import { Platform } from 'react-native'

export const IS_IOS = Platform.OS === 'ios'
export const IS_ANDROID = Platform.OS === 'android'
export const MAX_VIDEO_DURATION = 60_000

export const isAndroid13OrHigher = () => {
  if (Platform.OS === 'android') {
    return Platform.Version >= 33
  }
  return false
}

export const KID_BIRTHDATE_DATE_FORMAT = 'DD-MM-YYYY'
