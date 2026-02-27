import { useRef } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

interface UseScrollSwipeDownOptions {
  disabledSwipeDown?: boolean
  onSwipeDown?: () => void
}

export const useScrollSwipeDown = ({ disabledSwipeDown = false, onSwipeDown }: UseScrollSwipeDownOptions) => {
  const scrollStartY = useRef(0)

  const handleScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollStartY.current = event.nativeEvent.contentOffset.y
  }

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const endY = event.nativeEvent.contentOffset.y
    const isPullingDownFromTop = scrollStartY.current === 0 && endY <= 0
    if (!disabledSwipeDown && onSwipeDown && isPullingDownFromTop) {
      onSwipeDown()
    }
  }

  return {
    handleScrollBeginDrag,
    handleScrollEndDrag,
  }
}
