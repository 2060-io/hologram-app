import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'

import { Modal } from '../common'

import { IS_DEVICE_IOS, mainTextColor } from '@2060/constants'
import { useStatusBarHeight } from '@2060/hooks/useStatusBarHeight'

const heightScreen = Dimensions.get('screen').height
const widthScreen = Dimensions.get('screen').width

type Props = {
  visible: boolean
  children: React.ReactElement
  onCloseModal(): void
  renderHeader(onClose: () => void): React.ReactNode
  renderContent?(onClose: () => void): React.ReactNode
}

const LightboxModal = ({ visible, children, onCloseModal, renderHeader, renderContent }: Props) => {
  const statusBarHeight = useStatusBarHeight()
  const top = IS_DEVICE_IOS ? statusBarHeight + 35 : 0
  const background = <View style={styles.background} />
  const close = () => onCloseModal()

  const header = <View style={{ ...styles.header, top }}>{renderHeader(close)}</View>
  const content = <View style={styles.open}>{renderContent ? renderContent(close) : children}</View>

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={visible}
      onRequestClose={close}
      presentationStyle="fullScreen"
    >
      {background}
      {content}
      {header}
    </Modal>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: widthScreen,
    height: heightScreen,
    backgroundColor: mainTextColor,
  },
  open: {
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: widthScreen,
    height: heightScreen,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: widthScreen,
    backgroundColor: 'transparent',
  },
})

export default LightboxModal
