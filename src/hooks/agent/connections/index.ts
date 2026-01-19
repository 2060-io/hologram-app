import { ConnectionRecord } from '@credo-ts/core'
import { fetch as NetInfo } from '@react-native-community/netinfo'

import { AgentActionType } from '../actions/AgentAction'
import { DeleteConnectionParameters } from '../actions/types'

import { AgentActionQueueSingleton } from '@2060/services/AgentActionQueueSingleton'
import { MobileAgent } from '@2060/services/agent/MobileAgent'
import { isTerminated, deletePendingConnection } from '@2060/utils/connectionUtils'

export const deleteConnection = async (agent: MobileAgent, connection: ConnectionRecord) => {
  if (connection.isReady && !isTerminated(connection)) {
    const parameters: DeleteConnectionParameters = {
      connectionId: connection.id,
      outOfBandRecordId: connection.outOfBandId,
    }
    const agentActionQueueSingleton = AgentActionQueueSingleton.instance
    agentActionQueueSingleton.configureQueue()
    const isConnectedToInternet = Boolean((await NetInfo()).isConnected)
    agentActionQueueSingleton.addJob(
      {
        type: AgentActionType.DeleteConnection,
        parameters,
      },
      isConnectedToInternet,
    )
  } else {
    await deletePendingConnection(agent, connection)
  }
}
