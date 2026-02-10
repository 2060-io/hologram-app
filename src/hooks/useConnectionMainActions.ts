import { StackActions } from '@react-navigation/native'
import { useMemo } from 'react'

import { useChats } from './agent/ChatProvider'
import { useConfig } from './providers/ConfigProvider'
import { useVideoCallContext } from './providers/useVideoCallContext'

import { ActionProps, ConnectionMainActionsProps } from '@2060/components/common/ConnectionMainActions/Props'
import { isBlocked, isService, supportsAudioCalls, supportsVideoCalls } from '@2060/utils/connectionUtils'

type Props = Omit<ConnectionMainActionsProps, 'connectionId'>

export const useConnectionMainActions = ({ connection, navigation, includeDefaultActions }: Props) => {
  const { startCall } = useVideoCallContext()
  const { isDeveloperMode } = useConfig()
  const { findOrCreateThread } = useChats()
  const isConnectionService = isService(connection)
  const isConnectionBlocked = isBlocked(connection)

  const goToChat = () => {
    const chatThreadId = findOrCreateThread({ connection }).id
    navigation.dispatch(
      StackActions.push('ChatConversationStack', { screen: 'ChatConversation', params: { chatThreadId } }),
    )
  }
  const defaultActions: ActionProps[] = includeDefaultActions ? [{ value: 'text', onPress: goToChat }] : []

  const actions = useMemo(() => {
    if (!isDeveloperMode || isConnectionService || !connection.isReady || isConnectionBlocked) {
      return defaultActions
    }
    const actionsToReturn: ActionProps[] = [...defaultActions]
    if (supportsAudioCalls(connection)) {
      actionsToReturn.push({
        value: 'audio',
        onPress: () => startCall({ connection, callType: 'audio' }),
      })
    }
    if (supportsVideoCalls(connection)) {
      actionsToReturn.push({
        value: 'video',
        onPress: () => startCall({ connection, callType: 'video' }),
      })
    }
    return actionsToReturn
  }, [connection, isDeveloperMode, isConnectionBlocked])

  return {
    actions,
  }
}
