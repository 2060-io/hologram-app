import React from 'react'

import {
  ConnectionMainActionsProps,
  InitialConnectionMainActionsProps,
} from '@src/components/common/ConnectionMainActions/Props'
import { useConnectionById } from '@src/hooks/agent/ConnectionsProvider'
import { isTerminated } from '@src/utils/connectionUtils'

export const withRenderConnectionMainActions =
  (Component: React.ComponentType<ConnectionMainActionsProps>) =>
  (props: InitialConnectionMainActionsProps) => {
    const { connectionId } = props
    const connection = useConnectionById(connectionId)
    if (!connection) return null
    const isConnectionTerminated = isTerminated(connection)
    if (isConnectionTerminated) return null
    return <Component {...props} connection={connection} />
  }
