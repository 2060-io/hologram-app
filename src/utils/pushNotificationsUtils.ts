import { ConnectionRecord } from '@credo-ts/core'
import notifee, {
  AndroidBadgeIconType,
  AndroidColor,
  AndroidGroupAlertBehavior,
  AndroidImportance,
  NotificationAndroid,
  NotificationIOS,
} from '@notifee/react-native'
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  isDeviceRegisteredForRemoteMessages,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging'
import { t } from 'i18next'
import { requestNotifications, RESULTS } from 'react-native-permissions'

import { getConnectionDisplayName } from './connectionUtils'

import { IS_ANDROID, IS_IOS, isAndroid13OrHigher } from '@2060/constants'
import { getLocalizedPreview } from '@2060/hooks/agent/chat/preview'
import { ChatEntry } from '@2060/model'

const LOCAL_NOTIFICATION_ID_PREFIX = 'local-notification'
const optionsNotificationAndroid = (options?: NotificationAndroid): NotificationAndroid => ({
  ...options,
  vibrationPattern: [300, 500],
  pressAction: { id: 'default' },
  lights: [AndroidColor.GREEN, 300, 600],
  smallIcon: 'ic_notification',
  sound: 'default',
  importance: AndroidImportance.HIGH,
  smallIconLevel: AndroidBadgeIconType.LARGE,
})

const optionsNotificationsIOS = (options?: NotificationIOS): NotificationIOS => ({
  ...options,
  criticalVolume: 0.9,
  foregroundPresentationOptions: { alert: true, sound: true, badge: true },
  critical: true,
  sound: 'default',
})

/**
 * Create a channel (required for Android)
 * @returns channelId
 */
const createChannel = async () => {
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

const askUserPushNotificationPermissionAndroid13OrHigher = async () => {
  const { status } = await requestNotifications(['alert', 'badge', 'sound', 'providesAppSettings'])
  const isGranted = status === RESULTS.GRANTED
  return isGranted
}

const askUserPushNotificationPermission = async () => {
  const { AUTHORIZED } = AuthorizationStatus
  const messaging = getMessaging()
  const authStatus = await requestPermission(messaging, { providesAppNotificationSettings: true })
  return authStatus === AUTHORIZED
}

export const requestNotificationsPermission = isAndroid13OrHigher()
  ? askUserPushNotificationPermissionAndroid13OrHigher
  : askUserPushNotificationPermission

export const getFcmDeviceToken = async () => {
  const messaging = getMessaging()
  if (!isDeviceRegisteredForRemoteMessages(messaging)) await registerDeviceForRemoteMessages(messaging)
  const token = await getToken(messaging)
  return token
}

export const arePushNotificationsAllowed = async () => {
  const messaging = getMessaging()
  const { AUTHORIZED } = AuthorizationStatus
  const authorizationStatus = await hasPermission(messaging)
  return authorizationStatus === AUTHORIZED
}

export const displayNewChatMessageNotification = async (
  connection: ConnectionRecord,
  chatEntry: ChatEntry,
) => {
  const data = {
    screen: 'PersonalChat',
    params: { chatThreadId: chatEntry.chatThreadId, connectionId: connection.id },
  }
  const channelId = await createChannel()
  const groupId = connection.id

  if (IS_ANDROID) {
    await notifee.displayNotification({
      id: `summary-${LOCAL_NOTIFICATION_ID_PREFIX}-chat-${groupId}`,
      data,
      android: {
        channelId,
        pressAction: { id: 'default' },
        groupId,
        groupSummary: true,
        groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
      },
    })
  }
  const localNotification = {
    id: `${LOCAL_NOTIFICATION_ID_PREFIX}-chat-${groupId}-${new Date().getTime()}`,
    title: getConnectionDisplayName(connection!),
    body: `${getLocalizedPreview(chatEntry)}`,
    data,
    android: optionsNotificationAndroid({
      channelId,
      groupId,
      groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
    }),
    ios: optionsNotificationsIOS({ threadId: groupId }),
  }
  notifee.displayNotification(localNotification)
  notifee.incrementBadgeCount()
}

export const displayNewConnectionNotification = async (connection: ConnectionRecord) => {
  const channelId = await createChannel()
  const newNotification = {
    id: `${LOCAL_NOTIFICATION_ID_PREFIX}-connection-${connection.id}`,
    title: t('connection.newConnection'),
    body: `${t('connection.youAreNowConnectedTo')} ${getConnectionDisplayName(connection)}`,
    data: {
      screen: 'ConnectionDetails',
      params: { connectionId: connection?.id },
    },
    android: optionsNotificationAndroid({ channelId }),
    ios: optionsNotificationsIOS(),
  }
  notifee.displayNotification(newNotification)
  notifee.incrementBadgeCount()
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
