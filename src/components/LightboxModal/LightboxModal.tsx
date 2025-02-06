import React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Modal } from '../common'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  visible: boolean
  children: React.ReactElement
  onCloseModal(): void
  renderHeader(onClose: () => void): React.ReactNode
}

const LightboxModal = ({ visible, children, onCloseModal, renderHeader }: Props) => {
  const close = () => onCloseModal()
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const styles = getStyles(theme)

  return (
    <Modal
      animationType="fade"
      transparent
      statusBarTranslucent={false}
      visible={visible}
      onRequestClose={close}
    >
      <View style={styles.container}>
        <View style={{ ...styles.headerContainer, top: insets.top }}>{renderHeader(close)}</View>
        <View style={styles.contentContainer}>{children}</View>
      </View>
    </Modal>
  )
}

export default LightboxModal
