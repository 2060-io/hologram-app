import React from 'react'

import { ConnectionMainActionsProps } from '@2060/components/common/ConnectionMainActions/Props'
import { isBlocked, isTerminated } from '@2060/utils/connectionUtils'

export const withRenderConnectionMainActions =
  (Component: React.ComponentType<ConnectionMainActionsProps>) => (props: ConnectionMainActionsProps) => {
    const { connection } = props
    const isConnectionCompleted = connection.isReady
    const isConnectionBlocked = isBlocked(connection)
    const isConnectionTerminated = isTerminated(connection)
    if (!isConnectionCompleted || isConnectionBlocked || isConnectionTerminated) return null
    return <Component {...props} />
  }
