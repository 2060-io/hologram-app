import { DidCommCredentialV1ProblemReportMessage } from '@credo-ts/anoncreds'
import { W3cCredentialRepository } from '@credo-ts/core'
import {
  DidCommCredentialExchangeRecord,
  DidCommCredentialState,
  DidCommCredentialV2ProblemReportMessage,
  DidCommMessage,
  DidCommProblemReportMessage,
  parseMessageType,
} from '@credo-ts/didcomm'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import Realm from 'realm'

import { createChatEntry, findAllByAssociatedRecordId, updateChatEntry } from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread } from '../services/ChatThreadService'

import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@src/model'
import { MobileAgent } from '@src/services/agent'
import {
  getDidCommCredentialDisplayMetadata,
  setDidCommCredentialMetadata,
} from '@src/services/agent/RecordMetadata'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'

export const handleCredentialExchangeRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: DidCommCredentialExchangeRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: DidCommMessage
}) => {
  const { agent, realm, record: credentialExchangeRecord, activeChatThreadId, message } = options
  if (!credentialExchangeRecord.connectionId) return

  const connection = await agent.didcomm.connections.getById(credentialExchangeRecord.connectionId)
  const thread = findOrCreateChatThread(realm, connection)
  const associatedMessageId = (
    await agent.didcomm.credentials.findRequestMessage(credentialExchangeRecord.id)
  )?.id

  const formatData = await agent.didcomm.credentials.getFormatData(credentialExchangeRecord.id)
  const schemaId = formatData.offer?.anoncreds?.schema_id ?? formatData.offer?.indy?.schema_id
  const credentialDefinitionId =
    formatData.offer?.anoncreds?.cred_def_id ?? formatData.offer?.indy?.cred_def_id

  // Find any VC Offer entry associated to this credential record and update its state
  const [vcOfferEntry] = findAllByAssociatedRecordId(
    realm,
    credentialExchangeRecord.id,
    ChatEntryType.VCOffer,
  )
  if (vcOfferEntry) {
    const { messageTypeUri } = parseMessageType(message.type)
    let isRefused = false
    const isProblemReportMessage = [
      DidCommCredentialV1ProblemReportMessage.type.messageTypeUri,
      DidCommCredentialV2ProblemReportMessage.type.messageTypeUri,
    ].includes(messageTypeUri)
    if (isProblemReportMessage) {
      const problemReportMessage = message as DidCommProblemReportMessage
      const description = problemReportMessage?.description?.en
      isRefused = description === 'e.msg.refused'
    }
    const credentialState = isRefused ? DidCommCredentialState.Declined : credentialExchangeRecord.state
    updateChatEntry(realm, {
      recordId: vcOfferEntry.id,
      state: vcOfferEntry.state, // TODO: update state
      associatedMessageId,
      metadata: {
        ...vcOfferEntry.metadata,
        credentialState,
      },
    })

    // If credential has been issued, populate credential record metadata
    if (credentialExchangeRecord.credentials[0]) {
      const credentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)
      const issuedCredentialRecord = await credentialRepository.getById(
        agent.context,
        credentialExchangeRecord.credentials[0].credentialRecordId,
      )
      const metadata = getDidCommCredentialDisplayMetadata(credentialExchangeRecord)
      if (metadata) setDidCommCredentialMetadata(issuedCredentialRecord, metadata)
      await credentialRepository.update(agent.context, issuedCredentialRecord)
    }

    return
  }

  // record not found: create a new one
  const issuedAt = credentialExchangeRecord.createdAt.getTime()
  const issuerId =
    connection.invitationDid ??
    (credentialDefinitionId
      ? (await agent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId)).credentialDefinition
          ?.issuerId
      : undefined)
  const issuerName = getConnectionDisplayName(connection)
  const issuerStatus = TrustResolutionOutcome.INVALID
  const issuerLogoUrl = getConnectionDisplayPicture(connection)
  const schemaName = schemaId ? (await agent.modules.anoncreds.getSchema(schemaId)).schema?.name : undefined

  createChatEntry(realm, {
    associatedRecordId: credentialExchangeRecord.id,
    associatedMessageId: credentialExchangeRecord.threadId,
    chatThreadId: thread.id,
    type: ChatEntryType.VCOffer,
    role: ChatEntryRole.Receiver,
    state: ChatEntryState.Created,
    createdAt: (options.receivedAt ?? new Date()).getTime(),
    metadata: {
      issuedAt,
      issuerId,
      issuerName,
      issuerStatus,
      issuerLogoUrl,
      schemaName,
      credentialState: credentialExchangeRecord.state,
    },
  })

  // Populate DIDCommm exchange record metadata
  setDidCommCredentialMetadata(credentialExchangeRecord, {
    schemaName: schemaName ?? '',
    issuedAt,
    issuerId: issuerId ?? '',
    issuerLogoUrl,
    issuerName,
    issuerStatus,
  })
  await agent.didcomm.credentials.update(credentialExchangeRecord)

  if (thread.id !== activeChatThreadId) {
    addUnread(realm, thread.id, 1)
  }
}
