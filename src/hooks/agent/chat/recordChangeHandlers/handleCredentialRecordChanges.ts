import { V1CredentialProblemReportMessage } from '@credo-ts/anoncreds'
import {
  AgentMessage,
  CredentialExchangeRecord,
  CredentialState,
  parseMessageType,
  ProblemReportMessage,
  V2CredentialProblemReportMessage,
  W3cCredentialRepository,
} from '@credo-ts/core'
import Realm from 'realm'

import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import {
  getDidCommCredentialDisplayMetadata,
  setDidCommCredentialMetadata,
} from '@2060/services/agent/RecordMetadata'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'

export const handleCredentialExchangeRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: CredentialExchangeRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: AgentMessage
}) => {
  const { agent, realm, record: credentialExchangeRecord, message } = options
  if (!credentialExchangeRecord.connectionId) return

  const connection = await agent.connections.getById(credentialExchangeRecord.connectionId)
  const thread = chatThreadService.findOrCreateChatThread(realm, connection)
  const associatedMessageId = (await agent.credentials.findRequestMessage(credentialExchangeRecord.id))?.id

  const formatData = await agent.credentials.getFormatData(credentialExchangeRecord.id)
  const schemaId = formatData.offer?.anoncreds?.schema_id ?? formatData.offer?.indy?.schema_id
  const credentialDefinitionId =
    formatData.offer?.anoncreds?.cred_def_id ?? formatData.offer?.indy?.cred_def_id

  // Find any VC Offer entry associated to this credential record and update its state
  const [vcOfferEntry] = chatEntryService.findAllByAssociatedRecordId(
    realm,
    credentialExchangeRecord.id,
    ChatEntryType.VCOffer,
  )
  if (vcOfferEntry) {
    const { messageTypeUri } = parseMessageType(message.type)
    let isRefused = false
    const isProblemReportMessage = [
      V1CredentialProblemReportMessage.type.messageTypeUri,
      V2CredentialProblemReportMessage.type.messageTypeUri,
    ].includes(messageTypeUri)
    if (isProblemReportMessage) {
      const problemReportMessage = message as ProblemReportMessage
      const description = problemReportMessage?.description?.en
      isRefused = description === 'e.msg.refused'
    }
    const credentialState = isRefused ? CredentialState.Declined : credentialExchangeRecord.state
    chatEntryService.updateState(realm, {
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
  const issuerStatus = 'notFound'
  const issuerLogoUrl = getConnectionDisplayPicture(connection)
  const schemaName = schemaId ? (await agent.modules.anoncreds.getSchema(schemaId)).schema?.name : undefined

  const chatEntry = chatEntryService.createChatEntry(realm, {
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
  await agent.credentials.update(credentialExchangeRecord)

  chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
}
