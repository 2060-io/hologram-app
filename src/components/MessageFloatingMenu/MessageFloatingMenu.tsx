import Clipboard from '@react-native-clipboard/clipboard'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import { PersonalChatStackParams } from '../Navigation/NavigationProps'
import ReactionMenu from '../ReactionMenu'

import MenuItem from './MenuItem'
import getStyles from './styles'

import { useChatActions } from '@2060/hooks'
import { RepliedMessage } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryState, TextMessageMetadata } from '@2060/model'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import FloatingChatMessage from '@2060/pages/PersonalChat/MessageCustomView/FloatingChatMessage'
import { MessageAction } from '@2060/pages/PersonalChat/PersonalChatProps'
import { MobileAgent } from '@2060/services/agent'

type Props = {
  navigation: StackNavigationProp<PersonalChatStackParams>
  agent: MobileAgent | undefined
  messageActions: MessageAction[]
  selectedMessage?: ChatEntryMessage
  showMessageFloatingMenu: boolean
  closeMessageFloatingMenu(): void
  setRepliedMessage(message?: RepliedMessage): void
  showReportMessageConfirmation(): void
  showDeleteMessageConfirmation(): void
  supportsMessageReceipts: boolean
  supportsMessageReactions: boolean
  using24HourFormat: boolean
  startSelectingMessagesMode(): void
  updateSelectedMessages(selectedMessage: ChatEntryMessage): void
  goToForwardMessages(): void
}

const MessageFloatingMenu = ({
  navigation,
  agent,
  messageActions,
  selectedMessage,
  showMessageFloatingMenu,
  closeMessageFloatingMenu,
  setRepliedMessage,
  showReportMessageConfirmation,
  showDeleteMessageConfirmation,
  supportsMessageReceipts,
  supportsMessageReactions,
  using24HourFormat,
  startSelectingMessagesMode,
  updateSelectedMessages,
  goToForwardMessages,
}: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { saveFileToGallery, shareMediaToApp, onRepliedMessage, reactToMessage } = useChatActions()
  const messageIsDeleted = selectedMessage?.state === ChatEntryState.Deleted

  const handleMessageReaction = (action: 'react' | 'unreact', emoji: string) => {
    if (!selectedMessage) return
    reactToMessage({
      message: selectedMessage,
      action,
      emoji,
    })
  }

  const handleSelectedAction = (actionId: string) => {
    if (!selectedMessage) return
    closeMessageFloatingMenu()
    const functionsCalledByAction: Record<string, () => unknown> = {
      'action-info': () => navigation.navigate('MessageDetails', { selectedMessage }),
      'action-forward': () => {
        updateSelectedMessages(selectedMessage)
        goToForwardMessages()
      },
      'action-select': () => {
        startSelectingMessagesMode()
        updateSelectedMessages(selectedMessage)
      },
      'action-save': async () => await saveFileToGallery(selectedMessage),
      'action-share': async () => await shareMediaToApp(selectedMessage),
      'action-reply': () => {
        const message = onRepliedMessage(selectedMessage)
        setRepliedMessage(message)
      },
      'action-delete': () => showDeleteMessageConfirmation(),
      'action-report': async () => showReportMessageConfirmation(),
      'action-copy': () => {
        Clipboard.setString((selectedMessage.metadata as TextMessageMetadata).content)
      },
    }
    functionsCalledByAction[actionId]()
  }

  return (
    <TouchableOpacity
      onPress={closeMessageFloatingMenu}
      style={[styles.container, { display: showMessageFloatingMenu ? 'flex' : 'none' }]}
      activeOpacity={1}
    >
      {showMessageFloatingMenu && selectedMessage && supportsMessageReactions && !messageIsDeleted && (
        <ReactionMenu
          message={selectedMessage}
          onClose={() => closeMessageFloatingMenu()}
          onReaction={handleMessageReaction}
        />
      )}
      {selectedMessage && (
        <FloatingChatMessage
          style={styles.messageContainer}
          currentMessage={selectedMessage}
          agent={agent}
          supportsMessageReceipts={supportsMessageReceipts}
          using24HourFormat={using24HourFormat}
          onTouchRepliedMessage={() => {}}
          renderCustomHeader={() => <></>}
        />
      )}
      <View style={styles.menuContainer}>
        {messageActions.map((option, index, elements) => (
          <MenuItem
            {...option}
            key={option.id}
            label={t(option.label!)}
            isNotLast={elements.length - 1 !== index}
            onActionSelected={handleSelectedAction}
          />
        ))}
      </View>
    </TouchableOpacity>
  )
}

export default memo(MessageFloatingMenu)
