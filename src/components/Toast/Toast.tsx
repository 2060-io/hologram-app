import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { TouchableOpacity, DeviceEventEmitter, Animated, ViewStyle, View } from 'react-native'

import getStyles from './styles'

import { SvgIcon, Text } from '@src/components/common'
import { SHOW_TOAST_MESSAGE, COLORS } from '@src/constants/toast'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ToastOptions } from '@src/utils/toast'

const Toast = () => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const [message, setMessage] = useState<ToastOptions | null>(null)
  const [timeOutDuration, setTimeOutDuration] = useState(2000)
  const timeOutRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const animatedOpacity = useRef(new Animated.Value(0)).current
  const typeMessage = message?.type ?? 'info'
  const positionMessage = message?.position ?? 'bottom'
  const { backgroundColor } = COLORS[typeMessage]
  const stylePosition: Record<string, ViewStyle> = {
    center: { bottom: '50%' },
    bottom: { bottom: 40 },
    top: { top: 0 },
  }

  useEffect(() => {
    const displayToast = (data: ToastOptions) => {
      setTimeout(() => {
        setMessage(data)
        if (data?.duration) setTimeOutDuration(data.duration)
      }, 200)
    }
    DeviceEventEmitter.addListener(SHOW_TOAST_MESSAGE, displayToast)
    return () => {
      DeviceEventEmitter.removeAllListeners()
    }
  }, [])

  const closeToast = useCallback(() => {
    setMessage(null)
    setTimeOutDuration(2000)
    clearInterval(timeOutRef.current)
    Animated.timing(animatedOpacity, { toValue: 0, useNativeDriver: false }).start()
  }, [message, timeOutDuration])

  useEffect(() => {
    const onMessageCountdown = () => {
      if (message) {
        timeOutRef.current = setInterval(() => {
          if (timeOutDuration === 0) closeToast()
          else setTimeOutDuration(prev => prev - 1000)
        }, 1000)
      }
    }
    onMessageCountdown()
    return () => {
      clearInterval(timeOutRef.current)
    }
  }, [message, timeOutDuration])

  useEffect(() => {
    if (message) {
      Animated.timing(animatedOpacity, { toValue: 1, duration: 1000, useNativeDriver: false }).start()
    }
  }, [message, animatedOpacity])

  if (!message) return <></>

  return (
    <Animated.View
      style={{
        ...styles.containerMessage,
        ...stylePosition[positionMessage],
        backgroundColor,
        opacity: animatedOpacity,
      }}
    >
      <Text style={styles.textMessage} numberOfLines={2}>
        {message.message}
      </Text>
      <TouchableOpacity onPress={closeToast} style={styles.rightContainer}>
        <View style={styles.close}>
          <SvgIcon name="close" fill={theme.colors.white} width={20} height={20} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default memo(Toast)
