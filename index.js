/* eslint-disable import/newline-after-import */
import messaging from '@react-native-firebase/messaging'
import { AppRegistry } from 'react-native'

import 'react-native-reanimated'
import 'react-native-gesture-handler'
import { name as appName } from './app.json'
import AppHeadless from './src/AppHeadless'
import { backgroundPushNotificationHandler } from './src/services/backgroundPushNotificationHandler'
import { isBackgroundNotificationHandlerEnabled } from './src/utils/developer'
;(async function () {
  const persistedIsBackgroundNotificationsEnabled = await isBackgroundNotificationHandlerEnabled()
  if (persistedIsBackgroundNotificationsEnabled) {
    // Register handler for FCM notifications when app is in quit state
    messaging().setBackgroundMessageHandler(backgroundPushNotificationHandler)
  }
})()

AppRegistry.registerComponent(appName, () => AppHeadless)
