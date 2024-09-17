import { useState, useEffect } from 'react'
import { NativeModules, StatusBar, NativeEventEmitter } from 'react-native'

import { IS_DEVICE_IOS } from '../constants'

const { StatusBarManager } = NativeModules
export const useStatusBarHeight = () => {
  const [value, setValue] = useState(StatusBar.currentHeight ?? 0)

  useEffect(() => {
    if (!IS_DEVICE_IOS) return
    const emitter = new NativeEventEmitter(StatusBarManager)

    StatusBarManager.getHeight(({ height }: { height: number }) => {
      setValue(height)
    })

    const listener = emitter.addListener('statusBarFrameWillChange', data => setValue(data.frame.height))
    return () => listener.remove()
  }, [])

  return value
}
