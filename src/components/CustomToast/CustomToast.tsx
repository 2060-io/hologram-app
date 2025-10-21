import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { View, TouchableOpacity, DeviceEventEmitter, Animated, StyleProp, ViewStyle } from 'react-native'

import styles from './styles'

import { SvgIcon, Text } from '@2060/components/common'
import { SHOW_TOAST_MESSAGE, COLORS } from '@2060/constants/toast'
import { ToastOptions } from '@2060/utils/toast'

const CustomToast = () => {
  const [message, setMessage] = useState<ToastOptions | null>(null)
  const [timeOutDuration, setTimeOutDuration] = useState(2000)
  const timeOutRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const animatedOpacity = useRef(new Animated.Value(0)).current
  const typeMessage = message?.type ?? 'info'
  const positionMessage = message?.position ?? 'bottom'
  const { backgroundColor, color, borderColor } = COLORS[typeMessage]
  const stylePosition: Record<string, StyleProp<ViewStyle>> = {
    center: { bottom: '50%' },
    bottom: { bottom: 45 },
    top: { top: 0 },
  }

  const onNewToast = (data: ToastOptions) => {
    setTimeout(() => {
      setMessage(data)
      if (data?.duration) setTimeOutDuration(data.duration)
    }, 200)
  }

  const closeToast = useCallback(() => {
    setMessage(null)
    setTimeOutDuration(2000)
    clearInterval(timeOutRef.current)
    Animated.timing(animatedOpacity, { toValue: 0, useNativeDriver: false }).start()
  }, [message, timeOutDuration])

  const onMessageCountdown = () => {
    if (message) {
      timeOutRef.current = setInterval(() => {
        if (timeOutDuration === 0) closeToast()
        else setTimeOutDuration(prev => prev - 1000)
      }, 1000)
    }
  }

  useEffect(() => {
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

  useEffect(() => {
    DeviceEventEmitter.addListener(SHOW_TOAST_MESSAGE, onNewToast)

    return () => {
      DeviceEventEmitter.removeAllListeners()
    }
  }, [])

  const iconsByMsgType = {
    info: <SvgIcon name="warning" fill="#fff" />,
    warning: <SvgIcon name="warning" fill="#fff" />,
    error: <SvgIcon name="warning" fill="#fff" />,
    success: <SvgIcon name="warning" fill="#fff" />,
  }

  if (!message) return <></>

  return (
    <Animated.View
      style={{
        ...styles.containerMessage,
        ...(stylePosition[positionMessage] as object),
        backgroundColor,
        borderColor,
        opacity: animatedOpacity,
      }}
    >
      <TouchableOpacity onPress={closeToast} style={styles.containerContentMessage}>
        <View style={[styles.containerIconMessage, { backgroundColor }]}>{iconsByMsgType[typeMessage]}</View>
        <Text style={[styles.textMessage, { color }]} numberOfLines={2}>
          {message.message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default memo(CustomToast)
