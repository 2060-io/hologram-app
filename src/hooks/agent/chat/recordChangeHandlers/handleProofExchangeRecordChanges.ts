import { AgentMessage, ProofExchangeRecord, ProofState, W3cCredentialRepository } from '@credo-ts/core'
import Realm from 'realm'

import { createChatEntry, findAllByAssociatedRecordId, updateMetadata } from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread, updateThread } from '../services/ChatThreadService'

import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { getDidCommPresentationDisplayMetadata } from '@2060/services/agent/RecordMetadata'
import {
  CredentialMainInfo,
  getCredentialMainInfo,
  getPresentationRequestForDisplay,
} from '@2060/services/agent/display'
import { getServiceInfo, VerifierInfo } from '@2060/services/api/trustRegistryService'
import { log, logError } from '@2060/utils'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'

export const handleProofExchangeRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: ProofExchangeRecord
  activeChatThreadId?: string
  receivedAt?: Date
  message: AgentMessage
}) => {
  const { agent, realm, record: proofRecord, activeChatThreadId, message } = options
  if (proofRecord.connectionId) {
    const connection = await agent.connections.getById(proofRecord.connectionId)
    const thread = chatThreadService.findOrCreateChatThread(realm, connection)
    let [vpResponseChatEntry] = chatEntryService.findAllByAssociatedRecordId(
      realm,
      proofRecord.id,
      ChatEntryType.VPResponse,
    )
    if (proofRecord.state === ProofState.RequestReceived) {
      if (vpResponseChatEntry) {
        // Update the metadata of the chat entry with the new proof state
        const newChatEntryMetadata = {
          ...vpResponseChatEntry.metadata,
          proofState: ProofState.PresentationReceived,
        }
        chatEntryService.updateMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
        await agent.proofs.acceptRequest({ proofRecordId: proofRecord.id })
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

        let [vpRequestChatEntry] = chatEntryService.findAllByAssociatedRecordId(
          realm,
          proofRecord.id,
          ChatEntryType.VPRequest,
        )

        if (!vpRequestChatEntry) {
          // TODO: Define metadata and update when state changes
          vpRequestChatEntry = chatEntryService.createChatEntry(realm, {
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

          chatThreadService.updateThread(realm, thread.id, { lastChatEntry: vpRequestChatEntry })
        }

        if (thread.id !== activeChatThreadId) {
          chatThreadService.addUnread(realm, thread.id, 1)
        }
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

        if (!vpResponseChatEntry) {
          vpResponseChatEntry = chatEntryService.createChatEntry(realm, {
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

          chatThreadService.updateThread(realm, thread.id, { lastChatEntry: vpResponseChatEntry })
        }
      }
      // Update the metadata of the chat entry if exists with the new proof state
      if (vpResponseChatEntry) {
        const newChatEntryMetadata = { ...vpResponseChatEntry.metadata, proofState: proofRecord.state }
        chatEntryService.updateMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
      }
      // Find any VP Request entry associated to this proof record and mark it as replied
      const [vpRequestEntry] = chatEntryService.findAllByAssociatedRecordId(
        realm,
        proofRecord.id,
        ChatEntryType.VPRequest,
      )
      if (vpRequestEntry) {
        const metadata = { ...vpRequestEntry.metadata, proofState: proofRecord.state, replied: true }
        updateMetadata(realm, vpRequestEntry.id, metadata)
      }
    } else if (
      proofRecord.state === ProofState.ProposalSent ||
      proofRecord.state === ProofState.ProposalReceived
    ) {
      const presentedCredentials: CredentialMainInfo[] = []
      try {
        const formatData = await agent.proofs.getFormatData(proofRecord.id)
        const requestedAttributes = formatData.proposal?.anoncreds?.requested_attributes

        if (requestedAttributes) {
          const firstAttribute = Object.values(requestedAttributes)[0]

          if (firstAttribute.restrictions?.length) {
            const credentialDefinitionId = firstAttribute.restrictions[0].cred_def_id

            if (credentialDefinitionId) {
              log('credentialDefinitionId', credentialDefinitionId)

              const serviceInfo = await getServiceInfo({
                did: credentialDefinitionId,
                trustedServiceResolverBaseUrl: 'https://tsr.2060.io',
              })
              log('serviceInfoserviceInfo', serviceInfo)
              if (serviceInfo) {
                const finalCredentialMainInfo: CredentialMainInfo = {
                  id: serviceInfo.id,
                  recordId: credentialDefinitionId,
                  createdAt: new Date(),
                  // TODO: get schema name
                  schemaName: 'We need to get schema name',
                  issuer: {
                    id: credentialDefinitionId,
                    name: serviceInfo.name,
                    logoUrl: serviceInfo.logoUrl,
                    status: serviceInfo.status,
                  },
                }
                presentedCredentials.push(finalCredentialMainInfo)
              }
            }
          }
        }
      } catch (e) {
        logError(`Error getting credential presented info ${e}`)
      }
      const role =
        proofRecord.state === ProofState.ProposalSent ? ChatEntryRole.Sender : ChatEntryRole.Receiver
      const isReceiver = role === ChatEntryRole.Receiver
      const chatEntry = chatEntryService.createChatEntry(realm, {
        associatedRecordId: proofRecord.id,
        chatThreadId: thread.id,
        type: ChatEntryType.VPResponse,
        role,
        state: ChatEntryState.Created,
        createdAt: new Date().getTime(),
        metadata: {
          proofState: proofRecord.state,
          presentedCredentials: JSON.stringify(presentedCredentials),
        },
        ...(isReceiver && { associatedMessageId: message.id }),
      })
      chatThreadService.updateThread(realm, thread.id, { lastChatEntry: chatEntry })
      if (thread.id !== activeChatThreadId && isReceiver) {
        chatThreadService.addUnread(realm, thread.id, 1)
      }
    }
  }
}
