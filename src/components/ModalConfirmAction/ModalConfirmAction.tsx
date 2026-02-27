import React from 'react'
import { View } from 'react-native'

import getStyles from './styles'

import ModalBottomHalf from '@src/components/ModalBottomHalf'
import { MainButton, Text, OutlinedButton, OutlinedGreenButton } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

type Props = {
  visible: boolean
  title: string
  subTitle?: string
  confirmText: string
  confirmTextSecondary?: string
  cancelText: string
  onClose(): void
  onConfirm(): void
  onConfirmSecondary?(): void
  onCancel(): void
}

const ModalConfirmAction = ({
  visible,
  title,
  subTitle,
  confirmText,
  confirmTextSecondary,
  cancelText,
  onClose,
  onConfirm,
  onConfirmSecondary,
  onCancel,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <ModalBottomHalf visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <Text fontFamily="EuclidCircularA-Medium" style={styles.titleDelete}>
          {title}
        </Text>
        {subTitle && <Text style={styles.descriptionDelete}>{subTitle}</Text>}
        <MainButton text={confirmText} style={styles.button} onPress={onConfirm} />
        {confirmTextSecondary && onConfirmSecondary && (
          <OutlinedGreenButton
            text={confirmTextSecondary}
            style={styles.button}
            onPress={onConfirmSecondary}
          />
        )}
        <OutlinedButton text={cancelText} onPress={onCancel} />
      </View>
    </ModalBottomHalf>
  )
}

export default ModalConfirmAction
