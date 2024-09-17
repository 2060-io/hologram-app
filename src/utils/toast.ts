import { DeviceEventEmitter } from 'react-native'

import { SHOW_TOAST_MESSAGE } from '../constants/toast'

export type PositionToast = 'center' | 'bottom' | 'top'

export type ToastOptions = {
  message: string
  duration?: number
  type: 'info' | 'warning' | 'error' | 'success'
  position?: PositionToast
}

export const toast = (options: ToastOptions | null) => {
  DeviceEventEmitter.emit(SHOW_TOAST_MESSAGE, options)
}
