import {
  AndroidBadgeIconType,
  AndroidColor,
  AndroidImportance,
  NotificationAndroid,
  NotificationIOS,
} from '@notifee/react-native'
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

export const IS_DEVICE_IOS = Platform.OS === 'ios'

export const optionsNotificationAndroid = (options?: NotificationAndroid): NotificationAndroid => ({
  ...options,
  vibrationPattern: [300, 500],
  pressAction: { id: 'default' },
  lights: [AndroidColor.GREEN, 300, 600],
  smallIcon: 'ic_notification',
  sound: 'default',
  importance: AndroidImportance.HIGH,
  largeIcon: require('../assets/images/app-icon.png'),
  smallIconLevel: AndroidBadgeIconType.LARGE,
  color: primaryColor,
  circularLargeIcon: true,
})

export const optionsNotificationsIOS = (options?: NotificationIOS): NotificationIOS => ({
  ...options,
  criticalVolume: 0.9,
  foregroundPresentationOptions: { alert: true, sound: true, badge: true },
  critical: true,
  sound: 'default',
})
