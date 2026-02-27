import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { fetch as NetInfo } from '@react-native-community/netinfo'

import { AgentActionType } from '../actions/AgentAction'
import { DeleteConnectionParameters } from '../actions/types'

import { AgentActionQueueSingleton } from '@src/services/AgentActionQueueSingleton'
import { MobileAgent } from '@src/services/agent/MobileAgent'
import { isTerminated, deletePendingConnection } from '@src/utils/connectionUtils'

export const deleteConnection = async (agent: MobileAgent, connection: DidCommConnectionRecord) => {
  if (connection.isReady && !isTerminated(connection)) {
    const parameters: DeleteConnectionParameters = {
      connectionId: connection.id,
      outOfBandRecordId: connection.outOfBandId,
    }
    const isNetworkConnected = Boolean((await NetInfo()).isConnected)
    AgentActionQueueSingleton.instance.addJob(
      {
        type: AgentActionType.DeleteConnection,
        parameters,
      },
      isNetworkConnected,
    )
  } else {
    await deletePendingConnection(agent, connection)
  }
}
