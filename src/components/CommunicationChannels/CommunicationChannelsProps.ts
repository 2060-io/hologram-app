import { StyleProp, ViewStyle } from 'react-native'

export type Channels = {
  allowChats: boolean
  allowAudioCalls: boolean
  allowVideoCalls: boolean
}

export type CommunicationChannelsProps = {
  channels: Channels
  containerChannelsStyle?: StyleProp<ViewStyle>
  setChannels: React.Dispatch<React.SetStateAction<Channels>>
}
