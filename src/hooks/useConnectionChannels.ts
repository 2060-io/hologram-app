import { useMemo } from 'react'

import { useConfig } from './providers/ConfigProvider'
import { useVideoCallContext } from './providers/useVideoCallContext'

import { ChannelProps, ChannelIconsProps } from '@2060/components/common/ChannelIcons/ChannelIconProps'
import { isService, supportsAudioCalls, supportsVideoCalls } from '@2060/utils/connectionUtils'

type Props = Omit<ChannelIconsProps, 'iconColor'>

export const useConnectionChannels = ({ defaultChannels = [], connection }: Props) => {
  const { startCall } = useVideoCallContext()
  const { isDeveloperMode } = useConfig()
  const isConnectionService = isService(connection)

  const channels = useMemo(() => {
    const channelsToReturn: ChannelProps[] = [...defaultChannels]
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

  return {
    channels,
  }
}
