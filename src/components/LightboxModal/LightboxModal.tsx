import React, { useRef } from 'react'
import { GestureResponderEvent, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Modal } from '../common'

import getStyles from './styles'

import { useTheme } from '@src/hooks/providers/ThemeProvider'

const DIFF_VALUE_TO_DETECT_SWIPE_DOWN = 60

type Props = {
  visible: boolean
  children: React.ReactElement
  closeModal(): void
  renderHeader(): React.ReactNode
}

const LightboxModal = ({ visible, children, closeModal, renderHeader }: Props) => {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)
  const initialSwipeAxis = useRef({ x: 0, y: 0 })
  const swipeAlreadyDetected = useRef(false)

  const onTouchStart = (e: GestureResponderEvent) => {
    swipeAlreadyDetected.current = false
    initialSwipeAxis.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
  }

  const detectSwipeDown = (e: GestureResponderEvent) => {
    const currentYAxis = e.nativeEvent.pageY
    const isSwipeDown = currentYAxis - initialSwipeAxis.current.y >= DIFF_VALUE_TO_DETECT_SWIPE_DOWN
    if (isSwipeDown && !swipeAlreadyDetected.current) {
      swipeAlreadyDetected.current = true
      closeModal()
    }
  }

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent={false}
      visible={visible}
      onRequestClose={closeModal}
    >
      <Pressable style={styles.container} onTouchStart={onTouchStart} onTouchMove={detectSwipeDown}>
        <View style={{ ...styles.headerContainer, top: insets.top }}>{renderHeader()}</View>
        <View style={styles.contentContainer}>{children}</View>
      </Pressable>
    </Modal>
  )
}

export default LightboxModal
