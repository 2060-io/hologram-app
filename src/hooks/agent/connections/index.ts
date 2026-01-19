import {
  ConnectionRecord,
  KeylistUpdateAction,
  MediationRecipientService,
  ConnectionService,
} from '@credo-ts/core'
import { fetch as NetInfo } from '@react-native-community/netinfo'

import { AgentActionType } from '../actions/AgentAction'
import { DeleteConnectionParameters } from '../actions/types'

import { AgentActionQueueSingleton } from '@2060/services/AgentActionQueueSingleton'
import { MobileAgent } from '@2060/services/agent/MobileAgent'
import { isTerminated, isBlocked, deletePendingConnection } from '@2060/utils/connectionUtils'

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

const updateConnectionMediationKeylist = async (
  agent: MobileAgent,
  record: ConnectionRecord,
  action: KeylistUpdateAction,
) => {
  if (record.mediatorId && record.did) {
    const did = await agent.dids.resolve(record.did)

    if (did.didDocument) {
      const mediationRecipientService = agent.dependencyManager.resolve(MediationRecipientService)
      const mediationRecord = await mediationRecipientService.getById(agent.context, record.mediatorId)
      await mediationRecipientService.keylistUpdateAndAwait(
        agent.context,
        mediationRecord,
        did.didDocument.recipientKeys.map(item => {
          return {
            recipientKey: item,
            action,
          }
        }),
      )
    }
  }
}

export const blockConnection = async (agent: MobileAgent, record: ConnectionRecord) => {
  if (!isBlocked(record)) {
    await updateConnectionMediationKeylist(agent, record, KeylistUpdateAction.remove)
    record.setTag('blocked', true)
    await agent.dependencyManager.resolve(ConnectionService).update(agent.context, record)
  }
}

export const unblockConnection = async (agent: MobileAgent, record: ConnectionRecord) => {
  if (isBlocked(record)) {
    await updateConnectionMediationKeylist(agent, record, KeylistUpdateAction.add)
    record.setTag('blocked', false)
    await agent.dependencyManager.resolve(ConnectionService).update(agent.context, record)
  }
}
