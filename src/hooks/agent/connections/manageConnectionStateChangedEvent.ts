import { ConnectionEventTypes, ConnectionStateChangedEvent } from '@credo-ts/core'

import { MobileAgent } from '@2060/services/agent'
import { displayNewConnectionNotification } from '@2060/utils/pushNotificationsUtils'

export const manageConnectionStateChangedEvent = (agent: MobileAgent) => {
  const connectionsListener = async (data: ConnectionStateChangedEvent) => {
    const connection = data.payload.connectionRecord
    if (connection.isReady) {
      displayNewConnectionNotification(connection)
    }
  }

  const addConnectionChangeListener = () => {
    agent.events.on<ConnectionStateChangedEvent>(
      ConnectionEventTypes.ConnectionStateChanged,
      connectionsListener,
    )
  }

  const removeConnectionChangeListener = () => {
    agent.events.off<ConnectionStateChangedEvent>(
      ConnectionEventTypes.ConnectionStateChanged,
      connectionsListener,
    )
  }

  return {
    addConnectionChangeListener,
    removeConnectionChangeListener,
  }
}
