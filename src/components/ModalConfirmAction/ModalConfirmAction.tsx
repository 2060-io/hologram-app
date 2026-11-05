import { MainButton, OutlinedButton, OutlinedGreenButton, Text } from '@src/components/common'
import ModalBottomHalf from '@src/components/ModalBottomHalf'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import React from 'react'
import { View } from 'react-native'
import getStyles from './styles'

type Props = {
  visible: boolean
  title: string
  subTitle?: string
  confirmText: string
  confirmTestID?: string
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
  confirmTestID = 'modal-confirm',
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
        <MainButton testID={confirmTestID} text={confirmText} style={styles.button} onPress={onConfirm} />
        {confirmTextSecondary && onConfirmSecondary && (
          <OutlinedGreenButton
            testID="modal-confirm-secondary"
            text={confirmTextSecondary}
            style={styles.button}
            onPress={onConfirmSecondary}
          />
        )}
        <OutlinedButton testID="modal-cancel" text={cancelText} onPress={onCancel} />
      </View>
    </ModalBottomHalf>
  )
}

export default ModalConfirmAction
