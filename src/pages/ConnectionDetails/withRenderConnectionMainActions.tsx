import React from 'react'

import {
  ConnectionMainActionsProps,
  InitialConnectionMainActionsProps,
} from '@2060/components/common/ConnectionMainActions/Props'
import { useConnectionById } from '@2060/hooks/agent/ConnectionProvider'
import { isBlocked, isTerminated } from '@2060/utils/connectionUtils'

export const withRenderConnectionMainActions =
  (Component: React.ComponentType<ConnectionMainActionsProps>) =>
  (props: InitialConnectionMainActionsProps) => {
    const { connectionId } = props
    const connection = useConnectionById(connectionId)
    if (!connection) return null
    const isConnectionCompleted = connection.isReady
    const isConnectionBlocked = isBlocked(connection)
    const isConnectionTerminated = isTerminated(connection)
    if (!isConnectionCompleted || isConnectionBlocked || isConnectionTerminated) return null
    return <Component {...props} connection={connection} />
  }
