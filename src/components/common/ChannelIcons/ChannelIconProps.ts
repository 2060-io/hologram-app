import { ConnectionRecord } from '@credo-ts/core'

export type CommChannel = 'text' | 'video' | 'audio'

export const ChannelIconsNames = { text: 'chat', audio: 'phoneUp', video: 'video' }

export type ChannelProps = {
  value: CommChannel
  onPress: () => void
}

export type ChannelIconsProps = {
  defaultChannels?: ChannelProps[]
  connection: ConnectionRecord
  iconColor: string
}
