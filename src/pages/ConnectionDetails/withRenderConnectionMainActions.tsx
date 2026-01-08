import React from 'react'

import {
  ConnectionMainActionsProps,
  InitialConnectionMainActionsProps,
} from '@2060/components/common/ConnectionMainActions/Props'
import { useConnectionById } from '@2060/hooks/agent/ConnectionProvider'
import { isTerminated } from '@2060/utils/connectionUtils'

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
