import { getApp } from '@react-native-firebase/app'
import {
  type AppCheck,
  getToken,
  initializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check'
import Config from 'react-native-config'

let appCheck: AppCheck | undefined

// There is no getter for the App Check instance, and headless code may need a token before the UI mounts
function getAppCheck(): AppCheck {
  if (!appCheck) {
    const provider = new ReactNativeFirebaseAppCheckProvider()
    provider.configure({
      android: {
        provider: Config.APP_CHECK_DEBUG_MODE ? 'debug' : 'playIntegrity',
        debugToken: Config.ANDROID_FIREBASE_DEBUG_TOKEN,
      },
      apple: {
        provider: Config.APP_CHECK_DEBUG_MODE ? 'debug' : 'appAttestWithDeviceCheckFallback',
        debugToken: Config.IOS_FIREBASE_DEBUG_TOKEN,
      },
    })
    appCheck = initializeAppCheck(getApp(), { provider, isTokenAutoRefreshEnabled: true })
  }
  return appCheck
}

export const getAppCheckToken = async () => (await getToken(getAppCheck())).token

export const getAppCheckHeaders = async () => ({
  'X-Firebase-AppCheck': await getAppCheckToken(),
})
