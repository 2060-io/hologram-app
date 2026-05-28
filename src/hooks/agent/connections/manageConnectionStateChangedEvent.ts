import { DidCommConnectionEventTypes, DidCommConnectionStateChangedEvent } from '@credo-ts/didcomm'

import { MobileAgent } from '@src/services/agent'
import { displayNewConnectionNotification } from '@src/utils/pushNotificationsUtils'

export const manageConnectionStateChangedEvent = (agent: MobileAgent) => {
  const connectionsListener = async (data: DidCommConnectionStateChangedEvent) => {
    const connection = data.payload.connectionRecord
    if (connection.isReady) {
      displayNewConnectionNotification(connection)
    }
  }

  const addConnectionChangeListener = () => {
    agent.events.on<DidCommConnectionStateChangedEvent>(
      DidCommConnectionEventTypes.DidCommConnectionStateChanged,
      connectionsListener
    )
  }

  const removeConnectionChangeListener = () => {
    agent.events.off<DidCommConnectionStateChangedEvent>(
      DidCommConnectionEventTypes.DidCommConnectionStateChanged,
      connectionsListener
    )
  }

  return {
    addConnectionChangeListener,
    removeConnectionChangeListener,
  }
}
