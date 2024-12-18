import AsyncStorage from '@react-native-community/async-storage'

import { logError } from '@2060/utils'

// This storage key saves the value that indicates if user has enable display logs as toast message
export const LOGS_ENABLED_PERSIST_KEY = 'logsEnabled'

// This storage key saves the value that indicates if user has enable background notifications handler
export const BACKGROUND_PUSH_NOTIFICATION_HANDLER_ENABLED_PERSIST_KEY = 'backgroundPushNotificationsEnabled'

/*
This storage key saves the value that indicates if app is currently
processing push notifications in background
*/
export const IS_PROCESSING_BACKGROUND_NOTIFICATIONS_PERSIST_KEY = 'isProcessingBackgroundNotifications'

// Android only. This storage key saves the value of current google account selected in backup process
export const GOOGLE_ACCOUNT_BACKUP_PERSIST_KEY = 'googleAccountBackup'

/*
This storage key saves the value that indicates if backup
process must include media content (audios, images, videos)
*/
export const BACKUP_INCLUDES_MEDIA_PERSIST_KEY = 'backupIncludesMedia'

/*
This storage key saves (Object type of AutomaticDownloadTypes in String format) for
each media item(audio, image, video) and its corresponding automatic download value
*/
export const AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY = 'automaticMediaDownloadValues'

// This storage key saves the value that indicates if user has developer mode enabled
export const DEVELOPER_MODE_ENABLED_PERSIST_KEY = 'developerModeEnabled'

/*
This storage key saves (Object type of DevEnvsObject in String format) for
each dev env value that user has currently set in app
*/
export const DEV_ENVS_PERSIST_KEY = 'developmentEnvironments'

/*
This storage key saves (Object type of DevEnvsObject in String format) for
each dev env value that user has created in app to use as custom or alternative
to default ones
*/
export const CUSTOM_DEV_ENVS_PERSIST_KEY = 'customDevelopmentEnvironments'

// This storage key saves the value that indicates if user has screen lock enabled
export const SCREEN_LOCK_ENABLED_PERSIST_KEY = 'screenLockEnabled'

export const setStorageData = async (key: string, value: unknown) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (error) {
    logError(JSON.stringify(error))
  }
}

export const getStorageData = async (key: string): Promise<unknown | null | undefined> => {
  try {
    const value = await AsyncStorage.getItem(key)
    if (value) return JSON.parse(value)

    return null
  } catch (error) {
    logError(JSON.stringify(error))
  }
}
