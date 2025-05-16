import { Platform } from 'react-native'
import { DocumentDirectoryPath } from 'react-native-fs'

import { hexTransparency, lightenDarken } from '../utils/colorUtils'

// region Styles ---------------------------------------------------------------------------------------------
export const whiteColor = '#FFFFFF'
export const primaryColor = '#7678EC'
export const secondaryColor = '#fdab38'
export const redColor = '#FF0000'
export const mainTextColor = '#000000'
export const grayColor = '#727272'
export const waterColor = (value: string) => hexTransparency(lightenDarken(value, 60), '20')
export const IS_IOS = Platform.OS === 'ios'
export const IS_ANDROID = Platform.OS === 'android'
export const MAX_VIDEO_DURATION = 60000

export const isAndroid13OrHigher = () => {
  if (Platform.OS === 'android') {
    return Platform.Version >= 33
  }
  return false
}

export const KID_BIRTHDATE_DATE_FORMAT = 'DD-MM-YYYY'
export const CONFIG_FILE_PATH = `${DocumentDirectoryPath}/config.json`
