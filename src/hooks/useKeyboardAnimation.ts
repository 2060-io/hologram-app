import { useKeyboardHandler } from 'react-native-keyboard-controller'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useKeyboardAnimation = () => {
  const keyboardHeight = useSharedValue(0)
  const { bottom } = useSafeAreaInsets()
  useKeyboardHandler({
    onStart: e => {
      'worklet'
      const willKeyboardAppear = e.progress === 1
      keyboardHeight.value = e.height - (willKeyboardAppear ? bottom : 0)
    },
    onEnd: e => {
      'worklet'
      const willKeyboardAppear = e.progress === 1
      keyboardHeight.value = e.height - (willKeyboardAppear ? bottom : 0)
    },
  })

  return { keyboardHeight }
}
