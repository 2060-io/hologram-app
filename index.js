import 'text-encoding'
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'
import { AppRegistry } from 'react-native'
import { FileLogger } from 'react-native-file-logger'

import 'react-native-reanimated'
import 'react-native-gesture-handler'
import { appName } from './app.json'
import App from './src/App'
import AppHeadless from './src/AppHeadless'
import { IS_IOS } from './src/constants'
import { backgroundPushNotificationHandler } from './src/services/backgroundPushNotificationHandler'
import { LOGS_DIRECTORY, log, logError } from './src/utils/log'

const formatter = (_, msg) => {
  const now = new Date()
  return `${now.toISOString()} ${msg}`
}

const TEN_MB = 1024 * 1024 * 10
// Register handler for FCM notifications when app is in quit state
const messaging = getMessaging()
setBackgroundMessageHandler(messaging, backgroundPushNotificationHandler)
AppRegistry.registerComponent('hologram', () => (IS_IOS ? AppHeadless : App))
FileLogger.configure({
  logsDirectory: LOGS_DIRECTORY,
  logPrefix: appName,
  maximumFileSize: TEN_MB,
  formatter,
})
  .then(() => log('react-native-file-logger setup!'))
  .catch((error) => logError(`An error has occurred configuring react-native-file-logger: ${error}`))
