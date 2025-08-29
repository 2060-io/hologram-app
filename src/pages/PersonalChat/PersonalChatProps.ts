import { ChatEntryMessage, ChatParticipant } from './ChatMessage/Props'

export type MediaInfo = {
  user?: ChatParticipant
  createdAt: Date | number
}

export type ImageProps = {
  mediaRecordId: string
  fileMediaInfo: MediaInfo
  chatEntry: ChatEntryMessage
  displayTimeAndTicks: boolean
}

export type MediaProps = {
  mediaRecordId: string
  fileMediaInfo: MediaInfo
  chatEntry: ChatEntryMessage
  displayTimeAndTicks: boolean
}

export type MessageAction = {
  id: string
  icon: string
  asIcon?: 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons' | 'FontAwesome'
  label?: string
}
