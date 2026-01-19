import {
  OutOfBandInvitation,
  AgentContext,
  ConnectionRecord,
  ConnectionsApi,
  OutOfBandRole,
  KeylistUpdateAction,
  MediationRecipientService,
  ConnectionService,
} from '@credo-ts/core'
import { tryParseDid } from '@credo-ts/core/build/modules/dids/domain/parse'
import { fetch as NetInfo } from '@react-native-community/netinfo'

import { AgentActionType } from '../actions/AgentAction'
import { DeleteConnectionParameters } from '../actions/types'

import { AgentActionQueueSingleton } from '@2060/services/AgentActionQueueSingleton'
import { MobileAgent } from '@2060/services/agent/MobileAgent'
import { log, logError, logWarn } from '@2060/utils'
import { isTerminated, isBlocked } from '@2060/utils/connectionUtils'

export const findExistingConnection = async (
  agentContext: AgentContext,
  invitation: OutOfBandInvitation,
): Promise<ConnectionRecord | undefined> => {
  // If it is an invitation from a public DID, check if there is a connection established with it
  const existingConnections = await agentContext.dependencyManager
    .resolve(ConnectionsApi)
    .findByInvitationDid(tryParseDid(invitation.id) ? invitation.id : invitation.invitationDids[0])
  if (existingConnections.length > 1) {
    logWarn(`Multiple connections found related to invitation id ${invitation.id}`)
  }

  if (existingConnections.length > 0) return existingConnections[0]
}

export const deletePendingConnection = async (agent: MobileAgent, connection: ConnectionRecord) => {
  try {
    log(`Deleting pending connection with id: ${connection.id}`)
    await agent.connections.deleteById(connection.id)
    // Once the connection has been eliminated, delete its associated OOB record (only if we were invited
    // as the OOB record can be still valid for invitations we have created)
    const outOfBandRecordId = connection.outOfBandId
    if (!outOfBandRecordId) return
    const outOfBandRecord = await agent.oob.findById(outOfBandRecordId)
    if (outOfBandRecord?.role === OutOfBandRole.Receiver) {
      await agent.oob.deleteById(outOfBandRecordId)
    }
  } catch (error) {
    logError(`Error deleting pending connection with id: ${connection.id}`, error)
  }
}

export const deleteConnection = async (agent: MobileAgent, connection: ConnectionRecord) => {
  if (connection.isReady && !isTerminated(connection)) {
    const parameters: DeleteConnectionParameters = {
      connectionId: connection.id,
      outOfBandRecordId: connection.outOfBandId,
    }
    // Lazy import to avoid circular dependency
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
