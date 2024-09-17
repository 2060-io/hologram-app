import { ConnectionRecord } from '@credo-ts/core'
import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import SvgIcon, { IconsNames } from '../SvgIcon'

import { useNetwork } from '@2060/hooks'
import { StartCallPros, useVideoCallContext } from '@2060/hooks/providers/useVideoCallContext'
import { isBlocked, isTerminated, supportsAudioCalls, supportsVideoCalls } from '@2060/utils/connectionUtils'
import { toast } from '@2060/utils/toast'

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
  const { assertConnectedNetwork } = useNetwork()
  const { t } = useTranslation()
  const isNetworkConnectedRef = useRef<boolean>()
  const isNetworkConnected = assertConnectedNetwork()

  useEffect(() => {
    isNetworkConnectedRef.current = isNetworkConnected
  }, [isNetworkConnected])

  const checkIfCanStartCall = (args: StartCallPros) => {
    if (isNetworkConnectedRef.current) {
      startCall(args)
    } else {
      toast({ type: 'error', message: t('call.youNeedInternetConnection') })
    }
  }

  const channels = useMemo(() => {
    const channelsToReturn: ChannelProps[] = defaultChannels
    if (supportsAudioCalls(connection)) {
      channelsToReturn.push({
        value: 'audio',
        onPress: () => checkIfCanStartCall({ connection, callType: 'audio' }),
      })
    }
    if (supportsVideoCalls(connection)) {
      channelsToReturn.push({
        value: 'video',
        onPress: () => checkIfCanStartCall({ connection, callType: 'video' }),
      })
    }
    return channelsToReturn
  }, [connection])

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
