import React from 'react'

import { ChannelIconsProps } from '@2060/components/common/ChannelIcons/ChannelIconProps'
import { isBlocked, isTerminated } from '@2060/utils/connectionUtils'

export const withConnectionMainActions =
  (Component: React.ComponentType<ChannelIconsProps>) => (props: ChannelIconsProps) => {
    const { connection } = props
    const isConnectionCompleted = connection.isReady
    const isConnectionBlocked = isBlocked(connection)
    const isConnectionTerminated = isTerminated(connection)
    if (!isConnectionCompleted || isConnectionBlocked || isConnectionTerminated) return null
    return <Component {...props} />
  }
