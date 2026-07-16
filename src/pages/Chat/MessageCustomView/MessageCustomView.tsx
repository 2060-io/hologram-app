import { RadioButton } from '@src/components/common'
import { useChat } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatEntryRole, ChatEntryState } from '@src/model'
import { MessageProps } from '@src/pages/Chat/ChatMessage/Props'
import React, { memo, useEffect, useState } from 'react'
import { Keyboard, TouchableOpacity, View, ViewStyle } from 'react-native'
import { isSameUser } from '../utils'
import BaseCustomView from './BaseCustomView'
import Reactions from './Reactions'
import getStyles, { REACTIONS_MARGIN_BOTTOM } from './styles'
import { getMessageBorders } from './utils'

const MessageCustomView: React.FC<MessageProps> = memo((props) => {
  const { displayMessageFloatingMenu } = useChat()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { previousMessage, currentMessage, nextMessage } = props
  const { isSelectingMessagesMode, selectedMessages, updateSelectedMessages, tappedRepliedMessageChatEntryId } =
    useChat()
  const [temporaryStylesForRepliedMessage, setTemporaryStylesForRepliedMessage] = useState<ViewStyle>({})
  const sameUser = isSameUser(currentMessage, nextMessage)
  const prevMessageChatEntry = previousMessage
  const chatEntry = currentMessage
  const nextMessageChatEntry = nextMessage
  const isSender = chatEntry.role === ChatEntryRole.Sender
  const borders = getMessageBorders({ prevMessageChatEntry, chatEntry, nextMessageChatEntry })
  const position: 'right' | 'left' = isSender ? 'right' : 'left'
  const hasReactions = !!chatEntry.reactions.length
  const extraMarginBottom = hasReactions ? REACTIONS_MARGIN_BOTTOM : 0
  const containerMarginBottom = (sameUser ? 4 : theme.edges.messageMargin) + extraMarginBottom
  const isMessageSelected = !!selectedMessages.find((entry) => entry.id === currentMessage.id)

  useEffect(() => {
    if (tappedRepliedMessageChatEntryId === currentMessage.id) {
      setTemporaryStylesForRepliedMessage(styles.tappedRepliedMessageTemporaryStyle)
      setTimeout(() => setTemporaryStylesForRepliedMessage(styles.removedRepliedMessageTemporaryStyle), 3_000)
    }
  }, [tappedRepliedMessageChatEntryId])

  const handleDismissKeyboard = () => Keyboard.isVisible() && Keyboard.dismiss()

  return (
    <TouchableOpacity
      onPress={() => {
        if (isSelectingMessagesMode) {
          updateSelectedMessages(currentMessage)
        } else {
          handleDismissKeyboard()
        }
      }}
      style={styles.container}
      activeOpacity={1}
    >
      {isSelectingMessagesMode && <RadioButton style={styles.radioButton} isChecked={isMessageSelected} />}
      <View
        style={[styles[`${position}Container`], { marginBottom: containerMarginBottom }]}
        pointerEvents={isSelectingMessagesMode ? 'none' : undefined}
      >
        <View
          style={[
            styles.subContainer,
            styles[`${position}SubContainer`],
            { ...borders, ...temporaryStylesForRepliedMessage },
          ]}
        >
          <TouchableOpacity
            onPress={handleDismissKeyboard}
            onLongPress={() => displayMessageFloatingMenu(currentMessage)}
            accessibilityRole="text"
            activeOpacity={0.5}
          >
            <BaseCustomView {...props} borders={borders} />
          </TouchableOpacity>
        </View>
        {!!chatEntry.reactions.length && chatEntry.state !== ChatEntryState.Deleted && (
          <Reactions role={chatEntry.role} reactions={chatEntry.reactions} />
        )}
      </View>
    </TouchableOpacity>
  )
})

export default MessageCustomView
