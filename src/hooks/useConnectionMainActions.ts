import { useMemo } from 'react'

import { useConfig } from './providers/ConfigProvider'
import { useVideoCallContext } from './providers/useVideoCallContext'

import { ActionProps, ConnectionMainActionsProps } from '@2060/components/common/ConnectionMainActions/Props'
import { isService, supportsAudioCalls, supportsVideoCalls } from '@2060/utils/connectionUtils'

type Props = Omit<ConnectionMainActionsProps, 'iconColor'>

export const useConnectionMainActions = ({ defaultActions = [], connection }: Props) => {
  const { startCall } = useVideoCallContext()
  const { isDeveloperMode } = useConfig()
  const isConnectionService = isService(connection)

  const actions = useMemo(() => {
    const actionsToReturn: ActionProps[] = [...defaultActions]
    if (!isDeveloperMode || isConnectionService) return actionsToReturn
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
  }, [connection, isDeveloperMode])

  return {
    actions,
  }
}
