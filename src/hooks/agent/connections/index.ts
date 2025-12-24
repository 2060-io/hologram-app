import { AgentContext, tryParseDid } from '@credo-ts/core'
import {
  DidCommConnectionRecord,
  DidCommConnectionRepository,
  DidCommConnectionsApi,
  DidCommConnectionService,
  DidCommKeylistUpdateAction,
  DidCommMediationRecipientService,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandRole,
} from '@credo-ts/didcomm'

import { MobileAgent } from '@2060/services/agent/MobileAgent'
import { logWarn } from '@2060/utils'
import { isTerminated, isBlocked } from '@2060/utils/connectionUtils'

export const findExistingConnection = async (
  agentContext: AgentContext,
  invitation: DidCommOutOfBandInvitation,
): Promise<DidCommConnectionRecord | undefined> => {
  // If it is an invitation from a public DID, check if there is a connection established with it
  const existingConnections = await agentContext.dependencyManager
    .resolve(DidCommConnectionsApi)
    .findByInvitationDid(tryParseDid(invitation.id) ? invitation.id : invitation.invitationDids[0])
  if (existingConnections.length > 1) {
    logWarn(`Multiple connections found related to invitation id ${invitation.id}`)
  }

  if (existingConnections.length > 0) return existingConnections[0]
}

export const deleteConnection = async (agent: MobileAgent, record: DidCommConnectionRecord) => {
  const outOfBandRecordId = record.outOfBandId
  try {
    if (record.isReady && !isTerminated(record)) {
      await agent.didcomm.connections.hangup({ connectionId: record.id, deleteAfterHangup: true })
    } else {
      await agent.didcomm.connections.deleteById(record.id)
    }
  } catch (error) {
    // In case of error, delete the connection since it is already unusable.
    // FIXME: This is not ideal, since a failure here means that either the hangup message or
    // the keylist update
    // weren't sent to the other party and/or mediator respectively. So the proper way to fix
    // this is to retry sending these messages. However, since they are sent internally by Credo,
    // we should wait until a good Message Sending refactoring is done there
    logWarn(`Warning: error while hanging up connection ${record.id}. Record will be force-deleted.`)
    await agent.context.dependencyManager
      .resolve(DidCommConnectionRepository)
      .deleteById(agent.context, record.id)
  }

  // Once the connection has been eliminated, delete its associated OOB record (only if we were invited, as
  // the OOB record can be still valid for invitations we have created)
  if (!outOfBandRecordId) return
  const outOfBandRecord = await agent.didcomm.oob.findById(outOfBandRecordId)
  if (outOfBandRecord?.role === DidCommOutOfBandRole.Receiver) {
    await agent.didcomm.oob.deleteById(outOfBandRecordId)
  }
}

const updateConnectionMediationKeylist = async (
  agent: MobileAgent,
  record: DidCommConnectionRecord,
  action: DidCommKeylistUpdateAction,
) => {
  if (record.mediatorId && record.did) {
    const did = await agent.dids.resolve(record.did)

    if (did.didDocument) {
      const mediationRecipientService = agent.dependencyManager.resolve(DidCommMediationRecipientService)
      const mediationRecord = await mediationRecipientService.getById(agent.context, record.mediatorId)
      await mediationRecipientService.keylistUpdateAndAwait(
        agent.context,
        mediationRecord,
        did.didDocument.getRecipientKeysWithVerificationMethod({ mapX25519ToEd25519: true }).map(item => {
          return {
            recipientKey: item.publicJwk,
            action,
          }
        }),
      )
    }
  }
}

export const blockConnection = async (agent: MobileAgent, record: DidCommConnectionRecord) => {
  if (!isBlocked(record)) {
    await updateConnectionMediationKeylist(agent, record, DidCommKeylistUpdateAction.remove)
    record.setTag('blocked', true)
    await agent.dependencyManager.resolve(DidCommConnectionService).update(agent.context, record)
  }
}

export const unblockConnection = async (agent: MobileAgent, record: DidCommConnectionRecord) => {
  if (isBlocked(record)) {
    await updateConnectionMediationKeylist(agent, record, DidCommKeylistUpdateAction.add)
    record.setTag('blocked', false)
    await agent.dependencyManager.resolve(DidCommConnectionService).update(agent.context, record)
  }
}
