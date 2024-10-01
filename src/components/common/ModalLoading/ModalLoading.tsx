import React from 'react'
import { View } from 'react-native'

import Loader from '../Loader'
import Modal from '../Modal'

import getStyles from './styles'

import { useTheme } from '@2060/hooks/providers/ThemeProvider'

type Props = {
  visible: boolean
  message?: string
}

const ModalLoading = ({ visible, message }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Loader message={message} />
      </View>
    </Modal>
  )
}

export default ModalLoading
