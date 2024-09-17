import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'

import { log, logError } from './log'

import { IS_DEVICE_IOS } from '@2060/constants'

const MICROPHONE_PERMISSION = IS_DEVICE_IOS ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO

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
    if (!isGranted && IS_DEVICE_IOS) {
      log('Show iOS alert to user gives microphone permission')
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

export { checkMicrophonePermission, askMicrophonePermission, handleMicrophonePermission }
