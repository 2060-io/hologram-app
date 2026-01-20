import { CallOfferMessage, DidCommCallRole } from '@2060.io/credo-ts-didcomm-calls'
import { ShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { MessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import { ProfileMessage, PictureData, getConnectionProfile } from '@2060.io/credo-ts-didcomm-user-profile'
import {
  AgentContext,
  ConnectionRecord,
  ConnectionRepository,
  ConnectionsApi,
  ConnectionService,
  DidExchangeState,
  JsonTransformer,
  KeylistUpdateAction,
  MediationRecipientService,
  OutOfBandInvitation,
  OutOfBandRole,
  Protocol,
} from '@credo-ts/core'
import { tryParseDid } from '@credo-ts/core/build/modules/dids/domain/parse'

import { log, logError, logWarn } from './log'

import { dataUrl } from './index'

import { ConnectionType } from '@2060/model'
import { MobileAgent } from '@2060/services/agent/MobileAgent'

export const getConnectionDisplayName = (connection: ConnectionRecord) => {
  const profile = getConnectionProfile(connection)
  const nameDisplayName = profile?.displayName
  const nameAlias = connection.alias
  const namelabel = connection?.theirLabel
  const nameDid = connection.did
  const displayName = nameAlias || nameDisplayName || namelabel || nameDid || ''
  return displayName
}

export const getConnectionDisplayPicture = (connection: ConnectionRecord) => {
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

export const getConnectionDisplayIcon = (connection: ConnectionRecord) => {
  let displayIcon = ''
  try {
    const profile = getConnectionProfile(connection)
    if (profile?.displayIcon) displayIcon = getPictureDataUrl(profile.displayIcon)
  } catch (error) {
    logError('Error in getConnectionDisplayIcon', error)
  }
  return displayIcon
}

export const getPictureDataUrl = (displayPictureData: PictureData) => {
  return displayPictureData.links?.length
    ? displayPictureData.links[0]
    : dataUrl(displayPictureData.mimeType, displayPictureData.base64)
}

export const isService = (connection: ConnectionRecord) =>
  connection.invitationDid !== undefined && !connection.invitationDid.startsWith('did:peer')

export const isBlocked = (connection: ConnectionRecord) => connection.getTag('blocked') === true

export const lastTimeProfileSent = (connection: ConnectionRecord) =>
  connection.getTag('lastTimeProfileSent')?.toString() ?? connection.createdAt.toString()

export const setLastTimeProfileSent = async (connection: ConnectionRecord, agentContext: AgentContext) => {
  connection.setTag('lastTimeProfileSent', `${new Date()}`)
  await agentContext.dependencyManager.resolve(ConnectionRepository).update(agentContext, connection)
}

export const lastTimeProfileReceived = (connection: ConnectionRecord) =>
  connection.getTag('lastTimeProfileReceived')?.toString() ?? connection.createdAt.toString()

export const setLastTimeProfileReceived = async (
  connection: ConnectionRecord,
  agentContext: AgentContext,
) => {
  connection.setTag('lastTimeProfileReceived', `${new Date()}`)
  await agentContext.dependencyManager.resolve(ConnectionRepository).update(agentContext, connection)
}

export const isTerminated = (connection: ConnectionRecord) =>
  connection.isReady && (connection.theirDid === undefined || connection.did === undefined)

export const supportsMessageReceipts = (connection: ConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[MessageReceiptsMessage.type.protocolUri] !== undefined

export const supportsMessageReactions = (connection: ConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[MessageReactionsMessage.type.protocolUri] !== undefined

export const supportsMediaSharing = (connection: ConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[ShareMediaMessage.type.protocolUri] !== undefined

export const supportsUserProfile = (connection: ConnectionRecord) =>
  connection.metadata.get('features-protocol')?.[ProfileMessage.type.protocolUri] !== undefined

export const supportsVideoCalls = (connection: ConnectionRecord) => {
  const disclosure = connection.metadata.get('features-protocol')?.[CallOfferMessage.type.protocolUri]
  if (!disclosure) return false

  const protocol = JsonTransformer.fromJSON(disclosure, Protocol)
  return protocol.roles?.includes(DidCommCallRole.VideoCallee) ?? false
}

export const supportsAudioCalls = (connection: ConnectionRecord) => {
  const disclosure = connection.metadata.get('features-protocol')?.[CallOfferMessage.type.protocolUri]
  if (!disclosure) return false

  const protocol = JsonTransformer.fromJSON(disclosure, Protocol)
  return protocol.roles?.includes(DidCommCallRole.AudioCallee) ?? false
}

export const getConnectionType = (connectionRecord: ConnectionRecord) => {
  const connectionTypes = connectionRecord.getTags().connectionTypes
  return connectionTypes?.length
    ? connectionTypes[0]
    : isService(connectionRecord)
      ? ConnectionType.Service
      : ConnectionType.Peer
}

export const getConnectionParentId = (connectionRecord?: ConnectionRecord) =>
  connectionRecord?.getTag('parentConnectionId') as string | undefined
export const filterConnectionsByParentId = (connections: ConnectionRecord[], parentConnectionId: string) =>
  connections.filter(connection => connection.getTag('parentConnectionId') === parentConnectionId)

export const notAllowedConnectionsIdsToSendMessages = (connections: ConnectionRecord[]) => {
  return connections
    .filter(connection => connection.state !== DidExchangeState.Completed || isBlocked(connection))
    .map(({ id }) => id)
}

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
