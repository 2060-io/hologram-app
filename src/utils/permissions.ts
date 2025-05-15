import { t } from 'i18next'
import { Alert, Linking } from 'react-native'
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions'

import { logError } from './log'

import { IS_ANDROID_DEVICE, IS_DEVICE_IOS } from '@2060/constants'

const MICROPHONE_PERMISSION = IS_DEVICE_IOS ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO
const CAMERA_PERMISSION = IS_DEVICE_IOS ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA

const permissionText: Partial<Record<Permission, string>> = {
  [CAMERA_PERMISSION]: t('general.permissionNeededMessage', { permission: t('signUp.camera') }),
  [MICROPHONE_PERMISSION]: t('general.permissionNeededMessage', { permission: t('general.microphone') }),
}

const checkPermission = async (permission: Permission) => {
  try {
    const status = await check(permission)
    const isGranted = status === RESULTS.GRANTED
    return isGranted
  } catch (error) {
    logError(`Error getting ${permission} permission`, error)
    return false
  }
}

const askPermission = async (permission: Permission) => {
  try {
    const status = await request(permission)
    const isGranted = status === RESULTS.GRANTED
    if (status === RESULTS.BLOCKED) {
      Alert.alert(
        IS_DEVICE_IOS ? permissionText[permission]! : '',
        IS_ANDROID_DEVICE ? permissionText[permission]! : '',
        [
          { text: t('general.cancel'), style: 'destructive' },
          { text: t('general.settings'), style: 'default', onPress: () => Linking.openSettings() },
        ],
      )
    }
    return isGranted
  } catch (error) {
    logError(`Error asking ${permission} permission`, error)
    return false
  }
}

const checkMicrophonePermission = async () => {
  return await checkPermission(MICROPHONE_PERMISSION)
}

const askMicrophonePermission = async () => {
  return await askPermission(MICROPHONE_PERMISSION)
}

const handleMicrophonePermission = async () => {
  const canRecord = await checkMicrophonePermission()
  if (canRecord) {
    return canRecord
  } else {
    return await askMicrophonePermission()
  }
}

const handleCameraPermission = async () => {
  const hasCameraPermission = await checkPermission(CAMERA_PERMISSION)
  if (hasCameraPermission) {
    return hasCameraPermission
  } else {
    return await askPermission(CAMERA_PERMISSION)
  }
}

export {
  checkMicrophonePermission,
  askMicrophonePermission,
  handleMicrophonePermission,
  handleCameraPermission,
}
