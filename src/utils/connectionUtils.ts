import { CallOfferMessage, DidCommCallRole } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { DidCommMessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import {
  DidCommProfileMessage,
  PictureData,
  getConnectionProfile,
} from '@2060.io/credo-ts-didcomm-user-profile'
import { AgentContext, DidKey, JsonTransformer, tryParseDid } from '@credo-ts/core'
import {
  DidCommConnectionRecord,
  DidCommConnectionRepository,
  DidCommDidExchangeState,
  DidCommProtocol,
  DidCommConnectionsApi,
  DidCommConnectionService,
  DidCommKeylistUpdateAction,
  DidCommMediationRecipientService,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandRole,
  KeylistUpdateActionV2,
} from '@credo-ts/didcomm'

import { log, logError, logWarn } from './log'

import { dataUrl } from './index'

import { ConnectionType } from '@src/model'
import { MobileAgent } from '@src/services/agent/MobileAgent'

export const getConnectionDisplayName = (connection: DidCommConnectionRecord) => {
  const profile = getConnectionProfile(connection)
  const nameDisplayName = profile?.displayName
  const nameAlias = connection.alias
  const namelabel = connection?.theirLabel
  const nameDid = connection.did
  const displayName = nameAlias || nameDisplayName || namelabel || nameDid || ''
  return displayName
}

export const getConnectionDisplayPicture = (connection: DidCommConnectionRecord) => {
  let displayPicture = ''
  try {
    const profile = getConnectionProfile(connection)
    if (profile?.displayPicture) {
      displayPicture = getPictureDataUrl(profile.displayPicture)
    } else if (connection.imageUrl) {
      displayPicture = connection.imageUrl
    }
  } catch (error) {
    logError('Error in getConnectionDisplayPicture', error)
  }
  return displayPicture
}

export const getPictureDataUrl = (displayPictureData: PictureData) => {
  return displayPictureData.links?.length
    ? displayPictureData.links[0]
    : dataUrl(displayPictureData.mimeType, displayPictureData.base64)
}

export const isService = (connection: DidCommConnectionRecord) =>
  connection.invitationDid !== undefined && !connection.invitationDid.startsWith('did:peer')

export const isBlocked = (connection: DidCommConnectionRecord) => connection.getTag('blocked') === true

export const lastTimeProfileSent = (connection: DidCommConnectionRecord) =>
  connection.getTag('lastTimeProfileSent')?.toString() ?? connection.createdAt.toString()

export const setLastTimeProfileSent = async (
  connection: DidCommConnectionRecord,
  agentContext: AgentContext,
) => {
  connection.setTag('lastTimeProfileSent', `${new Date()}`)
  await agentContext.dependencyManager.resolve(DidCommConnectionRepository).update(agentContext, connection)
}

export const lastTimeProfileReceived = (connection: DidCommConnectionRecord) =>
  connection.getTag('lastTimeProfileReceived')?.toString() ?? connection.createdAt.toString()

export const setLastTimeProfileReceived = async (
  connection: DidCommConnectionRecord,
  agentContext: AgentContext,
) => {
  connection.setTag('lastTimeProfileReceived', `${new Date()}`)
  await agentContext.dependencyManager.resolve(DidCommConnectionRepository).update(agentContext, connection)
}

export const isTerminated = (connection: DidCommConnectionRecord) =>
  connection.isReady && (connection.theirDid === undefined || connection.did === undefined)

export const supportsMessageReceipts = (connection: DidCommConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[DidCommMessageReceiptsMessage.type.protocolUri] !== undefined

export const supportsMessageReactions = (connection: DidCommConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[MessageReactionsMessage.type.protocolUri] !== undefined

export const supportsMediaSharing = (connection: DidCommConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[DidCommShareMediaMessage.type.protocolUri] !== undefined

export const supportsUserProfile = (connection: DidCommConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[DidCommProfileMessage.type.protocolUri] !== undefined

export const supportsVideoCalls = (connection: DidCommConnectionRecord) => {
  const disclosure = connection.metadata.get('features-protocol')?.[CallOfferMessage.type.protocolUri]
  if (!disclosure) return false

  const protocol = JsonTransformer.fromJSON(disclosure, DidCommProtocol)
  return protocol.roles?.includes(DidCommCallRole.VideoCallee) ?? false
}

export const supportsAudioCalls = (connection: DidCommConnectionRecord) => {
  const disclosure = connection.metadata.get('features-protocol')?.[CallOfferMessage.type.protocolUri]
  if (!disclosure) return false

  const protocol = JsonTransformer.fromJSON(disclosure, DidCommProtocol)
  return protocol.roles?.includes(DidCommCallRole.AudioCallee) ?? false
}

export const getConnectionType = (connectionRecord: DidCommConnectionRecord) => {
  const connectionTypes = connectionRecord.getTags().connectionTypes
  return connectionTypes?.length
    ? connectionTypes[0]
    : isService(connectionRecord)
      ? ConnectionType.Service
      : ConnectionType.Peer
}

export const getConnectionParentId = (connectionRecord?: DidCommConnectionRecord) =>
  connectionRecord?.getTag('parentConnectionId') as string | undefined
export const filterConnectionsByParentId = (
  connections: DidCommConnectionRecord[],
  parentConnectionId: string,
) => connections.filter(connection => connection.getTag('parentConnectionId') === parentConnectionId)

export const notAllowedConnectionsIdsToSendMessages = (connections: DidCommConnectionRecord[]) => {
  return connections
    .filter(connection => connection.state !== DidCommDidExchangeState.Completed || isBlocked(connection))
    .map(({ id }) => id)
}

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

export const deletePendingConnection = async (agent: MobileAgent, connection: DidCommConnectionRecord) => {
  try {
    log(`Deleting pending connection with id: ${connection.id}`)
    await agent.didcomm.connections.deleteById(connection.id)
    // Once the connection has been eliminated, delete its associated OOB record (only if we were invited
    // as the OOB record can be still valid for invitations we have created)
    const outOfBandRecordId = connection.outOfBandId
    if (!outOfBandRecordId) return
    const outOfBandRecord = await agent.didcomm.oob.findById(outOfBandRecordId)
    if (outOfBandRecord?.role === DidCommOutOfBandRole.Receiver) {
      await agent.didcomm.oob.deleteById(outOfBandRecordId)
    }
  } catch (error) {
    logError(`Error deleting pending connection with id: ${connection.id}`, error)
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

      if (mediationRecord.mediationProtocolVersion === 'v2') {
        // CM 2.0: keylist stores recipient DIDs (did:key), not raw keys
        const v2Action =
          action === DidCommKeylistUpdateAction.add ? KeylistUpdateActionV2.add : KeylistUpdateActionV2.remove
        const recipientDids = did.didDocument
          .getRecipientKeysWithVerificationMethod({ mapX25519ToEd25519: true })
          .map(item => new DidKey(item.publicJwk).did)

        await mediationRecipientService.keylistUpdateAndAwaitV2(
          agent.context,
          mediationRecord,
          recipientDids.map(recipientDid => ({ recipientDid, action: v2Action })),
        )
      } else {
        // CM 1.0: keylist stores recipient keys
        await mediationRecipientService.keylistUpdateAndAwait(
          agent.context,
          mediationRecord,
          did.didDocument.getRecipientKeysWithVerificationMethod({ mapX25519ToEd25519: true }).map(item => ({
            recipientKey: item.publicJwk,
            action,
          })),
        )
      }
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
