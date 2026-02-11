import { W3cCredentialRepository } from '@credo-ts/core'
import { DidCommProofExchangeRecord, DidCommProofState } from '@credo-ts/didcomm'
import Realm from 'realm'

import {
  createChatEntry,
  findAllByAssociatedRecordId,
  updateChatEntryMetadata,
} from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread } from '../services/ChatThreadService'

import {
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  VerifierInfo,
  VPResponseMetadata,
  VPResponsePresentedCredential,
} from '@src/model'
import { MobileAgent } from '@src/services/agent'
import { getDidCommPresentationDisplayMetadata } from '@src/services/agent/RecordMetadata'
import { getCredentialMainInfo, getPresentationRequestForDisplay } from '@src/services/agent/display'
import {
  getCredentialRevealedAttributes,
  proposalGetCredentialAttributes,
  proposalGetCredentialInfo,
} from '@src/services/agent/proofs'
import { logError } from '@src/utils'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'

export const handleProofExchangeRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: DidCommProofExchangeRecord
  activeChatThreadId?: string
  receivedAt?: Date
}) => {
  const { agent, realm, record: proofRecord, activeChatThreadId } = options
  if (!proofRecord.connectionId) return
  const connection = await agent.didcomm.connections.getById(proofRecord.connectionId)
  const isEphemeral = connection.connectionTypes.includes('Ephemeral')
  if (isEphemeral) return
  const thread = findOrCreateChatThread(realm, connection)
  if (proofRecord.state === DidCommProofState.RequestReceived) {
    const [vpResponseChatEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPResponse)
    if (vpResponseChatEntry) {
      const newChatEntryMetadata = {
        ...vpResponseChatEntry.metadata,
        proofState: proofRecord.state,
      } as VPResponseMetadata
      updateChatEntryMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
      try {
        const requestedCredentials = await agent.didcomm.proofs.selectCredentialsForRequest({
          proofExchangeRecordId: proofRecord.id,
        })
        agent.didcomm.proofs.acceptRequest({
          proofExchangeRecordId: proofRecord.id,
          proofFormats: { anoncreds: requestedCredentials.proofFormats.anoncreds },
        })
      } catch (error) {
        logError(`Error accepting proof request`, error)
      }
    } else {
      const verifierInfo: VerifierInfo = {
        id: connection.invitationDid ?? getConnectionDisplayName(connection),
        logoUrl: getConnectionDisplayPicture(connection),
        name: getConnectionDisplayName(connection),
        status: 'trusted',
      }

      const presentationRequestForDisplay = await getPresentationRequestForDisplay({
        agent,
        proofRecordId: proofRecord.id,
        verifierInfo,
      })

      let [vpRequestChatEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPRequest)

      if (!vpRequestChatEntry) {
        // TODO: Define metadata and update when state changes
        vpRequestChatEntry = createChatEntry(realm, {
          associatedRecordId: proofRecord.id,
          associatedMessageId: proofRecord.threadId,
          chatThreadId: thread.id,
          type: ChatEntryType.VPRequest,
          role: ChatEntryRole.Receiver,
          state: ChatEntryState.Created,
          createdAt: (options.receivedAt ?? new Date()).getTime(),
          metadata: {
            proofState: proofRecord.state,
            requestedAttributes: JSON.stringify(presentationRequestForDisplay),
            replied: false,
          },
        })
        if (thread.id !== activeChatThreadId) {
          addUnread(realm, thread.id, 1)
        }
      }
    }
  } else if (
    proofRecord.state === DidCommProofState.PresentationSent ||
    proofRecord.state === DidCommProofState.RequestSent ||
    proofRecord.state === DidCommProofState.Declined ||
    proofRecord.state === DidCommProofState.Abandoned
  ) {
    let [vpResponseChatEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPResponse)
    // If a presentation has been effectively done, create an additional chat entry
    // including the preview of the credentials that have been sent
    if (proofRecord.state === DidCommProofState.PresentationSent) {
      const associatedMessageId = (await agent.didcomm.proofs.findPresentationMessage(proofRecord.id))?.id

      const didcommRecordMetadata = getDidCommPresentationDisplayMetadata(proofRecord)
      if (!didcommRecordMetadata) return

      const presentedCredentials: VPResponsePresentedCredential[] = []
      for (const item of didcommRecordMetadata.credentials) {
        const credentialRecord = await agent.dependencyManager
          .resolve(W3cCredentialRepository)
          .findById(agent.context, item.credentialId)
        if (credentialRecord) {
          const mainInfo = getCredentialMainInfo(credentialRecord)
          presentedCredentials.push({ mainInfo })
        }
      }
      const metadata: VPResponseMetadata = {
        proofState: proofRecord.state,
        presentedCredentials: JSON.stringify(presentedCredentials),
      }
      if (!vpResponseChatEntry) {
        vpResponseChatEntry = createChatEntry(realm, {
          associatedRecordId: proofRecord.id,
          associatedMessageId,
          chatThreadId: thread.id,
          type: ChatEntryType.VPResponse,
          role: ChatEntryRole.Sender,
          state: ChatEntryState.Created,
          createdAt: new Date().getTime(),
          metadata,
        })
      }
    }
    // Update the metadata of the chat entry if exists with the new proof state
    if (vpResponseChatEntry) {
      const newChatEntryMetadata = {
        ...vpResponseChatEntry.metadata,
        proofState: proofRecord.state,
      } as VPResponseMetadata
      updateChatEntryMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
    }
    // Find any VP Request entry associated to this proof record and mark it as replied
    const [vpRequestEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPRequest)
    if (vpRequestEntry) {
      const metadata = { ...vpRequestEntry.metadata, proofState: proofRecord.state, replied: true }
      updateChatEntryMetadata(realm, vpRequestEntry.id, metadata)
    }
  } else if (proofRecord.state === DidCommProofState.ProposalReceived) {
    const presentedCredentials: VPResponsePresentedCredential[] = []
    const credentialInfo = await proposalGetCredentialInfo({ agent, proofRecordId: proofRecord.id })
    const attributes = await proposalGetCredentialAttributes({ agent, proofRecordId: proofRecord.id })
    if (credentialInfo && attributes) {
      presentedCredentials.push({ mainInfo: credentialInfo, attributes })
    }
    const metadata: VPResponseMetadata = {
      proofState: proofRecord.state,
      presentedCredentials: JSON.stringify(presentedCredentials),
    }
    createChatEntry(realm, {
      associatedRecordId: proofRecord.id,
      chatThreadId: thread.id,
      type: ChatEntryType.VPResponse,
      role: ChatEntryRole.Receiver,
      state: ChatEntryState.Created,
      createdAt: new Date().getTime(),
      metadata,
      associatedMessageId: proofRecord.threadId,
    })
    if (thread.id !== activeChatThreadId) {
      addUnread(realm, thread.id, 1)
    }
  } else if (
    proofRecord.state === DidCommProofState.PresentationReceived ||
    proofRecord.state === DidCommProofState.Done
  ) {
    const [vpResponseChatEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPResponse)
    if (vpResponseChatEntry) {
      const currentMetadata = vpResponseChatEntry.metadata as VPResponseMetadata
      const presentedCredentials = JSON.parse(
        currentMetadata.presentedCredentials,
      ) as VPResponsePresentedCredential[]
      if (!presentedCredentials.length) return
      const attributes = await getCredentialRevealedAttributes({ agent, proofRecordId: proofRecord.id })
      const presentedCredentialInfoUpdated: VPResponsePresentedCredential = {
        mainInfo: { ...presentedCredentials[0].mainInfo },
        attributes,
      }
      const newChatEntryMetadata = {
        ...vpResponseChatEntry.metadata,
        proofState: proofRecord.state,
        presentedCredentials: JSON.stringify([presentedCredentialInfoUpdated]),
      } as VPResponseMetadata
      updateChatEntryMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
    }
  }
}
