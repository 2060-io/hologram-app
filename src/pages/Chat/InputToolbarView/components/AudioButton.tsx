import React, { memo, useRef } from 'react'
import { Pressable, GestureResponderEvent } from 'react-native'

import getStyles from '../styles'

import { SvgIcon } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

type Props = {
  onPress: () => void
  onLongPress: () => void
  onTouchEnd: (() => Promise<void>) | undefined
  isRecording: boolean
  isAutomaticRecording: boolean
  setAutomaticRecording: () => void
  cancelAudioRecording: () => void
}

const MINIMUM_VALUE_TO_DETECT_SWIPE = 110

const AudioButton = ({
  onPress,
  onLongPress,
  onTouchEnd,
  isRecording,
  isAutomaticRecording,
  setAutomaticRecording,
  cancelAudioRecording,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const swipeAxis = useRef({ x: 0, y: 0 })
  const swipeAlreadyDetected = useRef(false)
  const iconSize = isRecording && !isAutomaticRecording ? 28 : 22

  const onTouchStart = (e: GestureResponderEvent) => {
    swipeAlreadyDetected.current = false
    swipeAxis.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
  }

  const detectSwipe = (e: GestureResponderEvent) => {
    const isSwipeLeft = swipeAxis.current.x - e.nativeEvent.pageX >= MINIMUM_VALUE_TO_DETECT_SWIPE
    if (isSwipeLeft && !swipeAlreadyDetected.current) {
      swipeAlreadyDetected.current = true
      cancelAudioRecording()
      return
    }
    const isSwipeUp = swipeAxis.current.y - e.nativeEvent.pageY >= MINIMUM_VALUE_TO_DETECT_SWIPE
    if (isSwipeUp && !swipeAlreadyDetected.current) {
      swipeAlreadyDetected.current = true
      setAutomaticRecording()
    }
  }

  return (
    <Pressable
      delayLongPress={150}
      onTouchStart={onTouchStart}
      onLongPress={onLongPress}
      onTouchMove={detectSwipe}
      onPress={onPress}
      onTouchEnd={onTouchEnd}
      style={[
        styles.button,
        isRecording && !isAutomaticRecording
          ? { ...styles.microphoneIconContainerWhileRecording }
          : { ...styles.button },
        {
          backgroundColor: isRecording
            ? theme.colors.green
            : theme.isDarkMode
              ? theme.colors.primary
              : theme.colors.secondary,
        },
      ]}
    >
      <SvgIcon
        name={isRecording && isAutomaticRecording ? 'send' : 'microphone'}
        fill={isRecording ? theme.colors.white : theme.colors.primaryText}
        width={iconSize}
        height={iconSize}
      />
    </Pressable>
  )
}

export default memo(AudioButton)
