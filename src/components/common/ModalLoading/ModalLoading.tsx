import React from 'react'
import { View, ModalProps } from 'react-native'

import Loader from '../Loader'
import Modal from '../Modal'

import getStyles from './styles'

import { useTheme } from '@src/hooks/providers/ThemeProvider'

interface Props extends ModalProps {
  message?: string
}

const ModalLoading = ({ message, ...props }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Modal animationType="slide" {...props}>
      <View style={styles.container}>
        <Loader message={message} />
      </View>
    </Modal>
  )
}

export default ModalLoading
