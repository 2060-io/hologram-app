import { ChatEntryMessage, ChatParticipant } from './ChatMessage/Props'

import { VideoMetadata, ImageMetadata } from '@2060/model'

export type MediaInfo = {
  user?: ChatParticipant
  createdAt: Date | number
}

export type ImageProps = {
  mediaRecordId: string
  mediaItem: ImageMetadata
  fileMediaInfo: MediaInfo
  currentMessage: ChatEntryMessage
}

export type MediaProps = {
  mediaRecordId: string
  mediaItem: VideoMetadata
  fileMediaInfo: MediaInfo
  currentMessage: ChatEntryMessage
}

export type MessageAction = {
  id: string
  icon: string
  asIcon?: 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons' | 'FontAwesome'
  label?: string
}
