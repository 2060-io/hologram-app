/* eslint-disable import/newline-after-import */
import messaging from '@react-native-firebase/messaging'
import React from 'react'
import { AppRegistry } from 'react-native'

import 'react-native-reanimated'
import 'react-native-gesture-handler'
import { name as appName } from './app.json'
import App from './src/App'
import CustomToast from './src/components/CustomToast'
import { backgroundPushNotificationHandler } from './src/services/backgroundPushNotificationHandler'
import { getAreBackgroundNotificationsEnabled } from './src/utils/developer'
;(async function () {
  const persistedIsBackgroundNotificationsEnabled = await getAreBackgroundNotificationsEnabled()
  if (persistedIsBackgroundNotificationsEnabled) {
    // Register handler for FCM notifications when app is in quit state
    messaging().setBackgroundMessageHandler(backgroundPushNotificationHandler)
  }
})()

AppRegistry.registerComponent(appName, () => () => (
  <>
    <CustomToast />
    <App />
  </>
))
