import notifee, {
  AndroidBadgeIconType,
  AndroidColor,
  AndroidImportance,
  NotificationAndroid,
  NotificationIOS,
} from '@notifee/react-native'
import messaging from '@react-native-firebase/messaging'

import { getStorageData, setStorageData } from './asyncStorage'

import { IS_DEVICE_IOS, primaryColor } from '@2060/constants'

const { AuthorizationStatus } = messaging
export const LOCAL_NOTIFICATION_ID_PREFIX = 'local-notification'
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

export const requestNotificationPermissionUser = async () => {
  const { AUTHORIZED } = AuthorizationStatus
  const authStatus = await messaging().requestPermission({
    alert: true,
    badge: true,
    sound: true,
    provisional: false,
    providesAppNotificationSettings: true,
  })
  return authStatus === AUTHORIZED
}

export const getFcmDeviceToken = async () => {
  if (!messaging().isDeviceRegisteredForRemoteMessages) await messaging().registerDeviceForRemoteMessages()
  const fcmToken = await messaging().getToken()
  return fcmToken
}

export const checkApplicationPermission = async () => {
  const settings = await notifee.requestPermission({
    sound: true,
    alert: true,
    criticalAlert: true,
    badge: true,
    provisional: true,
  })
  return settings.authorizationStatus !== AuthorizationStatus.DENIED
}

/**
 * Create a channel (required for Android)
 * @returns channelId
 */
export const createChannel = async () => {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    vibrationPattern: [300, 500],
    lightColor: AndroidColor.GREEN,
    vibration: true,
    importance: AndroidImportance.HIGH,
    sound: 'default',
  })
  return channelId
}

export const deleteRemoteNotifications = async () => {
  if (IS_DEVICE_IOS) {
    notifee.cancelAllNotifications(['generic-new-messages'])
  } else {
    notifee.cancelAllNotifications(['0'], 'generic-new-messages')
  }
}

export const markNewConnectionNotificationAsViewed = async (connectionId: string) => {
  const localNotifications = (await notifee.getDisplayedNotifications()).filter(({ id }) =>
    id?.includes(LOCAL_NOTIFICATION_ID_PREFIX),
  )
  const objectiveNotifications = localNotifications
    .filter(({ id }) => id === `${LOCAL_NOTIFICATION_ID_PREFIX}-connection-${connectionId}`)
    .map(({ id }) => id as string)
  notifee.cancelAllNotifications(objectiveNotifications)
  const newBadgeCount = localNotifications.length - objectiveNotifications.length
  notifee.setBadgeCount(newBadgeCount)
}

export const markNotificationsOfChatAsViewed = async (connectionId: string) => {
  const localNotifications = (await notifee.getDisplayedNotifications()).filter(({ id }) =>
    id?.includes(LOCAL_NOTIFICATION_ID_PREFIX),
  )
  const localChatNotificationsOfConnection = localNotifications
    .filter(({ id }) => id?.includes(`${LOCAL_NOTIFICATION_ID_PREFIX}-chat-${connectionId}`))
    .map(({ id }) => id as string)
  notifee.cancelAllNotifications(localChatNotificationsOfConnection)
  const newBadgeCount = localNotifications.length - localChatNotificationsOfConnection.length
  notifee.setBadgeCount(newBadgeCount)
}

export const getIsProcessingBackgroundNotification = async () => {
  return ((await getStorageData('isProcessingBackgroundNotification')) as boolean) ?? false
}

/**
Function that updates the value of a boolean flag `isProcessingBackgroundNotification` in the storage.
It takes a boolean parameter `isProcessing` which defaults to `false`if not provided. The function stores
this boolean value in the storage under the key `'isProcessingBackgroundNotification'`.
This function is useful for keeping track of whether the application is currently
processing a background notification.
*/
export const updateIsProcessingBackgroundNotification = async (isProcessing = false) => {
  await setStorageData('isProcessingBackgroundNotification', isProcessing)
}
