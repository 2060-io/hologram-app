import { Alert, Linking } from 'react-native'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'

import { logError } from './log'

import { IS_DEVICE_IOS } from '@2060/constants'

const MICROPHONE_PERMISSION = IS_DEVICE_IOS ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO
const CAMERA_PERMISSION = IS_DEVICE_IOS ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA

const checkMicrophonePermission = async () => {
  try {
    const status = await check(MICROPHONE_PERMISSION)
    const isGranted = status === RESULTS.GRANTED
    return isGranted
  } catch (error) {
    logError('Error getting microphone permission ', error)
    return false
  }
}

const askMicrophonePermission = async () => {
  try {
    const status = await request(MICROPHONE_PERMISSION)
    const isGranted = status === RESULTS.GRANTED
    if (status === RESULTS.BLOCKED) {
      Alert.alert('permitelas', '', [
        { text: 'Ir a ajuster', style: 'default', onPress: () => Linking.openSettings() },
        { text: 'Cancelar', style: 'destructive' },
      ])
    }
    return isGranted
  } catch (error) {
    logError('Error asking microphone permission ', error)
    return false
  }
}

const handleMicrophonePermission = async () => {
  const canRecord = await checkMicrophonePermission()
  if (canRecord) {
    return canRecord
  } else {
    return await askMicrophonePermission()
  }
}

const checkCameraPermission = async () => {
  try {
    const status = await check(CAMERA_PERMISSION)
    const isGranted = status === RESULTS.GRANTED
    return isGranted
  } catch (error) {
    logError('Error getting CAMERA permission ', error)
    return false
  }
}

const askCameraPermission = async () => {
  try {
    const status = await request(CAMERA_PERMISSION)
    const isGranted = status === RESULTS.GRANTED
    if (status === RESULTS.BLOCKED) {
      Alert.alert('permitelas', '', [
        { text: 'Ir a ajuster', style: 'default', onPress: () => Linking.openSettings() },
        { text: 'Cancelar', style: 'destructive' },
      ])
    }
    return isGranted
  } catch (error) {
    logError('Error asking CAMERA permission ', error)
    return false
  }
}

const handleCameraPermission = async () => {
  const hasCameraPermission = await checkCameraPermission()
  if (hasCameraPermission) {
    return hasCameraPermission
  } else {
    return await askCameraPermission()
  }
}

export {
  checkMicrophonePermission,
  askMicrophonePermission,
  handleMicrophonePermission,
  handleCameraPermission,
}
