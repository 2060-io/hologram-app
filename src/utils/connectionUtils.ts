import { CallOfferMessage, DidCommCallRole } from '@2060.io/credo-ts-didcomm-calls'
import { ShareMediaMessage } from '@2060.io/credo-ts-didcomm-media-sharing'
import { MessageReactionsMessage } from '@2060.io/credo-ts-didcomm-reactions'
import { MessageReceiptsMessage } from '@2060.io/credo-ts-didcomm-receipts'
import { ProfileMessage, PictureData, getConnectionProfile } from '@2060.io/credo-ts-didcomm-user-profile'
import { ConnectionRecord, DidExchangeState, JsonTransformer, Protocol } from '@credo-ts/core'

import { log } from './log'

import { dataUrl } from './index'

import { ConnectionType } from '@2060/model'

export const getConnectionDisplayName = (connection: ConnectionRecord) => {
  const profile = getConnectionProfile(connection)
  const nameDisplayName = profile?.displayName
  const nameAlias = connection.alias
  const namelabel = connection?.theirLabel
  const nameDid = connection.did
  let displayName = nameAlias || nameDisplayName || namelabel || nameDid || ''
  return displayName
}

export const getConnectionDisplayPicture = (connection: ConnectionRecord) => {
  let displayPicture = ''

  try {
    const profile = getConnectionProfile(connection)
    displayPicture = getPictureDataUrl(profile?.displayPicture)
    if (displayPicture === '') displayPicture = connection.imageUrl || ''
  } catch (error) {
    log(`Cannot get display picture: ${error}`)
  }
  return displayPicture
}

export const getConnectionDisplayIcon = (connection: ConnectionRecord) => {
  let displayIcon = ''

  try {
    const profile = getConnectionProfile(connection)
    displayIcon = getPictureDataUrl(profile?.displayIcon)
  } catch (error) {
    log(`Cannot get display icon: ${error}`)
  }
  return displayIcon
}

export const getPictureDataUrl = (displayPictureData?: PictureData) =>
  displayPictureData?.links
    ? displayPictureData.links[0]
    : dataUrl(displayPictureData?.mimeType, displayPictureData?.base64)

export const isService = (connection: ConnectionRecord) =>
  connection.invitationDid !== undefined && !connection.invitationDid.startsWith('did:peer')

export const isBlocked = (connection: ConnectionRecord) => connection.getTag('blocked') === true

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

export const filterConnectionsByTypes = (options: {
  connections: ConnectionRecord[]
  types: string[]
  onlyParentConnections: boolean
}) =>
  options.connections.filter(
    connection =>
      (!options.onlyParentConnections || getConnectionParentId(connection) === undefined) &&
      options.types.includes(getConnectionType(connection)),
  )

export const notAllowedConnectionsIdsToSendMessages = (connections: ConnectionRecord[]) => {
  return connections
    .filter(connection => connection.state !== DidExchangeState.Completed || isBlocked(connection))
    .map(({ id }) => id)
}
