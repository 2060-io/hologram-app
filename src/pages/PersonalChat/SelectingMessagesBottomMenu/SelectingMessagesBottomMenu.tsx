import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import { ChatEntryMessage } from '../ChatMessage/Props'

import getStyles from './styles'

import { ModalConfirmAction } from '@src/components'
import { SvgIcon, Text } from '@src/components/common'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@src/model'

type Props = {
  selectedMessages: ChatEntryMessage[]
  deleteMessagesForMe(selectedMessages: ChatEntryMessage[]): Promise<void>
  stopSelectingMessagesMode(): void
  deleteMessagesForEveryone(selectedMessages: ChatEntryMessage[]): Promise<void>
  goToForwardMessages(): void
}

const MESSAGES_ALLOWED_FOR_FORWARD = [
  ChatEntryType.TextMessage,
  ChatEntryType.Image,
  ChatEntryType.Video,
  ChatEntryType.VoiceNote,
]

const SelectingMessagesBottomMenu = ({
  selectedMessages,
  deleteMessagesForMe,
  stopSelectingMessagesMode,
  deleteMessagesForEveryone,
  goToForwardMessages,
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [modalConfirmMessagesDeletion, setModalConfirmMessagesDeletion] = useState(false)
  const isDeleteButtonEnabled = !!selectedMessages.length
  const isForwardButtonEnabled = selectedMessages.length
    ? selectedMessages.every(selectedMessage => {
        const isAllowedForForward =
          MESSAGES_ALLOWED_FOR_FORWARD.includes(selectedMessage.type) &&
          selectedMessage.state !== ChatEntryState.Deleted
        return isAllowedForForward
      })
    : false

  const showModalConfirmMessagesDeletion = () => setModalConfirmMessagesDeletion(true)
  const closeModalConfirmMessagesDeletion = () => setModalConfirmMessagesDeletion(false)

  const confirmDeleteForEveryone = () => {
    const canDeleteForEveryone = selectedMessages.every(chatEntry => {
      const isSender = chatEntry.role === ChatEntryRole.Sender
      const isNotDeleted = chatEntry.state !== ChatEntryState.Deleted
      return isSender && isNotDeleted
    })
    return canDeleteForEveryone ? t('personalChat.deleteForEveryone') : undefined
  }

  const commonDeleteMessagesFlow = async (
    deleteCallback: (selectedMessages: ChatEntryMessage[]) => Promise<void>,
  ) => {
    closeModalConfirmMessagesDeletion()
    await deleteCallback(selectedMessages)
    stopSelectingMessagesMode()
  }

  const deleteForMe = async () => {
    await commonDeleteMessagesFlow(deleteMessagesForMe)
  }

  const deleteForEveryone = async () => {
    await commonDeleteMessagesFlow(deleteMessagesForEveryone)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        disabled={!isDeleteButtonEnabled}
        onPress={showModalConfirmMessagesDeletion}
        style={[
          styles.deleteButtonContainer,
          isDeleteButtonEnabled ? styles.enabledButton : styles.disabledButton,
        ]}
      >
        <SvgIcon name="trash" fill={theme.colors.blue} width={20} height={20} />
      </TouchableOpacity>
      <Text fontFamily="EuclidCircularA-Medium" style={styles.selectedText}>
        {t('general.selected', { count: selectedMessages.length })}
      </Text>
      <TouchableOpacity
        disabled={!isForwardButtonEnabled}
        style={[
          styles.forwardButtonContainer,
          isForwardButtonEnabled ? styles.enabledButton : styles.disabledButton,
        ]}
        onPress={goToForwardMessages}
      >
        <SvgIcon name="forward" fill={theme.colors.blue} width={20} height={20} />
      </TouchableOpacity>
      <ModalConfirmAction
        visible={modalConfirmMessagesDeletion}
        title={t('personalChat.deleteMessageConfirmation', { count: selectedMessages.length })}
        confirmText={t('personalChat.deleteForMe')}
        confirmTextSecondary={confirmDeleteForEveryone()}
        cancelText={t('general.cancel')}
        onClose={closeModalConfirmMessagesDeletion}
        onConfirm={deleteForMe}
        onConfirmSecondary={deleteForEveryone}
        onCancel={closeModalConfirmMessagesDeletion}
      />
    </View>
  )
}

export default SelectingMessagesBottomMenu
