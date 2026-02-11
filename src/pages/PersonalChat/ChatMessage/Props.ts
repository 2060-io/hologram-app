import { ReactElement } from 'react'
import { ViewStyle } from 'react-native'

import { ChatEntryData } from '@src/model'
import { MobileAgent } from '@src/services/agent'

export interface CustomHeaderProps {
  onSomeActionDispatched?(): void
}

export type ChatParticipant = {
  id: string
  name?: string
  avatar?: string
}

export type ChatEntryMessage = ChatEntryData

interface BaseMessageProps {
  agent?: MobileAgent
  supportsMessageReceipts: boolean
  using24HourFormat: boolean
  onTouchRepliedMessage(chatEntryId: string): void
  renderCustomHeader(props: CustomHeaderProps): ReactElement
}

export interface BaseCustomMessageViewProps extends BaseMessageProps {
  borders: ViewStyle
  currentMessage: ChatEntryMessage
  nextMessage?: ChatEntryMessage
  previousMessage?: ChatEntryMessage
}

export interface FloatingChatMessageProps extends BaseMessageProps {
  currentMessage: ChatEntryMessage
  style?: ViewStyle
}

export interface CommonMessageProps extends BaseMessageProps {
  isSelectingMessagesMode: boolean
  selectedMessages: ChatEntryMessage[]
  updateSelectedMessages(selectedMessage: ChatEntryMessage): void
}

export interface MessageProps extends CommonMessageProps {
  key: string
  currentMessage: ChatEntryMessage
  nextMessage?: ChatEntryMessage
  previousMessage?: ChatEntryMessage
}
