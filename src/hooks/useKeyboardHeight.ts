import { useEffect, useState } from 'react'
import { Keyboard, KeyboardEvent } from 'react-native'

import { IS_IOS } from '../constants'

export const useKeyboardHeight = () => {
  const [keyboardHeight, setkeyboardHeight] = useState(0)

  const handleKeyboardDidShow = (event: KeyboardEvent) => {
    setkeyboardHeight(event.endCoordinates.height)
  }
  const handleKeyboardDidHiden = () => setkeyboardHeight(0)

  useEffect(() => {
    const showEvent = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow'
    const hidenEvent = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide'
    Keyboard.addListener(showEvent, handleKeyboardDidShow)
    Keyboard.addListener(hidenEvent, handleKeyboardDidHiden)
    return () => {
      Keyboard.removeAllListeners(showEvent)
      Keyboard.removeAllListeners(hidenEvent)
    }
  }, [])

  return { keyboardHeight }
}
