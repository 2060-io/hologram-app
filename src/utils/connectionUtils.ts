import { CallOfferMessage, DidCommCallRole } from '@2060.io/credo-ts-didcomm-calls'
import { DidCommShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { DidCommMessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import {
  DidCommProfileMessage,
  PictureData,
  getConnectionProfile,
} from '@2060.io/credo-ts-didcomm-user-profile'
import { AgentContext, JsonTransformer } from '@credo-ts/core'
import {
  DidCommConnectionRecord,
  DidCommConnectionRepository,
  DidCommDidExchangeState,
  DidCommProtocol,
} from '@credo-ts/didcomm'

import { logError } from './log'

import { dataUrl } from './index'

import { ConnectionType } from '@2060/model'

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

export const getConnectionDisplayIcon = (connection: DidCommConnectionRecord) => {
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
