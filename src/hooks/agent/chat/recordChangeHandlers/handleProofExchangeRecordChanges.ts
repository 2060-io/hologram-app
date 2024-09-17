import { ProofExchangeRecord, ProofState, W3cCredentialRepository } from '@credo-ts/core'
import Realm from 'realm'

import * as chatEntryService from '../services/ChatEntryService'
import * as chatThreadService from '../services/ChatThreadService'

import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { getDidCommPresentationDisplayMetadata } from '@2060/services/agent/RecordMetadata'
import {
  CredentialMainInfo,
  getCredentialMainInfo,
  getPresentationRequestForDisplay,
} from '@2060/services/agent/display'
import { VerifierInfo } from '@2060/services/api/trustRegistryService'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'

export const handleProofExchangeRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: ProofExchangeRecord
  activeChatThreadId?: string
  receivedAt?: Date
}) => {
  const { agent, realm, record: proofRecord, activeChatThreadId } = options
  if (proofRecord.connectionId) {
    const connection = await agent.connections.getById(proofRecord.connectionId)
    const thread = chatThreadService.findOrCreateChatThread(realm, connection)

    if (proofRecord.state === ProofState.RequestReceived) {
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

      let [chatEntry] = chatEntryService.findAllByAssociatedRecordId(
        realm,
        proofRecord.id,
        ChatEntryType.VPRequest,
      )

      if (!chatEntry) {
        // TODO: Define metadata and update when state changes
        chatEntry = chatEntryService.createChatEntry(realm, {
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

        chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
      }

      if (thread.id !== activeChatThreadId) {
        chatThreadService.addUnread(realm, thread.id, 1)
      }
    } else if (
      proofRecord.state === ProofState.PresentationSent ||
      proofRecord.state === ProofState.Declined ||
      proofRecord.state === ProofState.Abandoned
    ) {
      // If a presentation has been effectively done, create an additional chat entry
      // including the preview of the credentials that have been sent
      if (proofRecord.state === ProofState.PresentationSent) {
        const associatedMessageId = (await agent.proofs.findPresentationMessage(proofRecord.id))?.id

        const didcommRecordMetadata = getDidCommPresentationDisplayMetadata(proofRecord)
        if (!didcommRecordMetadata) return

        const presentedCredentials: CredentialMainInfo[] = []

        for (const item of didcommRecordMetadata.credentials) {
          const credentialRecord = await agent.dependencyManager
            .resolve(W3cCredentialRepository)
            .findById(agent.context, item.credentialId)
          if (credentialRecord) presentedCredentials.push(getCredentialMainInfo(credentialRecord))
        }

        let [chatEntry] = chatEntryService.findAllByAssociatedRecordId(
          realm,
          proofRecord.id,
          ChatEntryType.VPResponse,
        )

        if (!chatEntry) {
          chatEntry = chatEntryService.createChatEntry(realm, {
            associatedRecordId: proofRecord.id,
            associatedMessageId,
            chatThreadId: thread.id,
            type: ChatEntryType.VPResponse,
            role: ChatEntryRole.Sender,
            state: ChatEntryState.Created,
            createdAt: new Date().getTime(),
            metadata: {
              proofState: proofRecord.state,
              presentedCredentials: JSON.stringify(presentedCredentials),
            },
          })

          chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
        }
      }
      // Find any VP Request entry associated to this proof record and mark it as replied
      const [vpRequestEntry] = chatEntryService.findAllByAssociatedRecordId(
        realm,
        proofRecord.id,
        ChatEntryType.VPRequest,
      )

      if (vpRequestEntry) {
        const metadata = { ...vpRequestEntry.metadata, proofState: proofRecord.state, replied: true }
        chatEntryService.updateMetadata(realm, vpRequestEntry.id, metadata)
      }
    }
  }
}
