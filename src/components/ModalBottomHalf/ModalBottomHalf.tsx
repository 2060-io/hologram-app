import React, { memo, useEffect, useRef, useState } from 'react'
import {
  Modal as NativeModal,
  View,
  Animated,
  Dimensions,
  PanResponder,
  StyleProp,
  ViewStyle,
  TouchableWithoutFeedback,
} from 'react-native'

import { Modal } from '../common'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type ModalBottomHalfProps = {
  visible: boolean
  onClose(): void
  styleContainer?: StyleProp<ViewStyle>
  children: React.ReactNode
}

const ModalBottomHalf = ({ visible, onClose, styleContainer, children }: ModalBottomHalfProps) => {
  const screenHeight = Math.round(Dimensions.get('screen').height)
  const modalRef = useRef<NativeModal | null>(null)
  const panY = useRef(new Animated.Value(screenHeight)).current
  const theme = useTheme()
  const styles = getStyles(theme)
  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: false,
  })

  const closeAnim = Animated.timing(panY, {
    toValue: screenHeight,
    duration: 500,
    useNativeDriver: false,
  })

  const top = panY.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0, 0, 1],
  })

  const handleDismiss = () => {
    closeAnim.start(() => modalRef.current?.props.onDismiss?.())
  }

  const panResponders = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: Animated.event([null, { dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gs) => {
        if (gs.dy > 0 && gs.vy > 1.5) return closeAnim.start(() => modalRef.current?.props.onDismiss?.())

        return resetPositionAnim.start()
      },
    }),
  )[0]

  useEffect(() => {
    if (visible) resetPositionAnim.start()
  }, [visible])

  return (
    <Modal
      ref={modalRef}
      animationType="slide"
      visible={visible}
      transparent={true}
      supportedOrientations={[
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right',
      ]}
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View {...panResponders.panHandlers}>
            <Animated.View style={[styles.container, { top }, styleContainer]}>
              <View style={styles.containerIcon} />
              {children}
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default memo(ModalBottomHalf)
