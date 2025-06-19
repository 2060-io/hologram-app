import notifee, {
  AndroidBadgeIconType,
  AndroidColor,
  AndroidImportance,
  NotificationAndroid,
  NotificationIOS,
} from '@notifee/react-native'
import messaging from '@react-native-firebase/messaging'
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions'

import { IS_IOS, isAndroid13OrHigher } from '@2060/constants'
import {
  getStorageData,
  IS_PROCESSING_BACKGROUND_NOTIFICATIONS_PERSIST_KEY,
  setStorageData,
} from '@2060/services/localStorage'

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
  color: '#7678EC',
  circularLargeIcon: true,
})

export const optionsNotificationsIOS = (options?: NotificationIOS): NotificationIOS => ({
  ...options,
  criticalVolume: 0.9,
  foregroundPresentationOptions: { alert: true, sound: true, badge: true },
  critical: true,
  sound: 'default',
})

const askUserPushNotificationPermissionAndroid13OrHigher = async () => {
  const status = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS)
  const isGranted = status === RESULTS.GRANTED
  return isGranted
}

const askUserPushNotificationPermission = async () => {
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

export const requestNotificationPermissionUser = isAndroid13OrHigher()
  ? askUserPushNotificationPermissionAndroid13OrHigher
  : askUserPushNotificationPermission

export const getFcmDeviceToken = async () => {
  if (!messaging().isDeviceRegisteredForRemoteMessages) await messaging().registerDeviceForRemoteMessages()
  const fcmToken = await messaging().getToken()
  return fcmToken
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
  if (IS_IOS) {
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
  return ((await getStorageData(IS_PROCESSING_BACKGROUND_NOTIFICATIONS_PERSIST_KEY)) as boolean) ?? false
}

/**
 * Updates the persistent storage flag indicating whether background notifications are being processed.
 *
 * @param isProcessing - A boolean value representing if background notification processing is ongoing.
 * @returns A promise that resolves when the storage update is complete.
 */
export const updateIsProcessingBackgroundNotification = async (isProcessing: boolean) => {
  await setStorageData(IS_PROCESSING_BACKGROUND_NOTIFICATIONS_PERSIST_KEY, isProcessing)
}
