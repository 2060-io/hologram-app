import { ConnectionRecord } from '@credo-ts/core'
import React, { useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { useConfig } from '@2060/hooks/providers/ConfigProvider'
import { useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'
import {
  isBlocked,
  isService,
  isTerminated,
  supportsAudioCalls,
  supportsVideoCalls,
} from '@2060/utils/connectionUtils'

export type CommChannel = 'text' | 'video' | 'audio'

export type ChannelProps = {
  value: CommChannel
  onPress: () => void
}

type Props = {
  defaultChannels?: ChannelProps[]
  connection: ConnectionRecord
  iconColor?: string
}

const channelsIcons = { text: 'chat', audio: 'phoneUp', video: 'video' }

const ChannelIcons = ({ defaultChannels = [], connection, iconColor }: Props) => {
  const { startCall } = useVideoCallContext()
  const { isDeveloperMode } = useConfig()
  const isConnectionService = isService(connection)

  const channels = useMemo(() => {
    const channelsToReturn: ChannelProps[] = defaultChannels
    if (!isDeveloperMode || isConnectionService) return channelsToReturn
    if (supportsAudioCalls(connection)) {
      channelsToReturn.push({
        value: 'audio',
        onPress: () => startCall({ connection, callType: 'audio' }),
      })
    }
    if (supportsVideoCalls(connection)) {
      channelsToReturn.push({
        value: 'video',
        onPress: () => startCall({ connection, callType: 'video' }),
      })
    }
    return channelsToReturn
  }, [connection, isDeveloperMode])

  return (
    <View style={{ flexDirection: 'row' }}>
      {channels?.map((channel, index) => (
        <TouchableOpacity
          key={channel.value}
          onPress={channel.onPress}
          activeOpacity={0.6}
          style={{ marginRight: index === channels.length - 1 ? 0 : 12 }}
        >
          <SvgIcon
            name={channelsIcons[channel.value] as keyof IconsNames}
            fill={iconColor}
            width={20}
            height={20}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const ChannelIconsWrapper = (props: Props) => {
  const { connection } = props
  const isConnectionCompleted = connection.isReady
  const isConnectionBlocked = isBlocked(connection)
  const isConnectionTerminated = isTerminated(connection)
  if (!isConnectionCompleted || isConnectionBlocked || isConnectionTerminated) return null
  return <ChannelIcons {...props} />
}

export default ChannelIconsWrapper
