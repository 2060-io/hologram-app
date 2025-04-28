import { ProofExchangeRecord, ProofState, W3cCredentialRepository } from '@credo-ts/core'
import Realm from 'realm'

import { createChatEntry, findAllByAssociatedRecordId, updateMetadata } from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread, updateThread } from '../services/ChatThreadService'

import {
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  VPResponseMetadata,
  VPResponsePresentedCredential,
} from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { getDidCommPresentationDisplayMetadata } from '@2060/services/agent/RecordMetadata'
import {
  CredentialMainInfo,
  getCredentialMainInfo,
  getPresentationRequestForDisplay,
  sanitizeString,
} from '@2060/services/agent/display'
import { getServiceInfo, VerifierInfo } from '@2060/services/api/trustRegistryService'
import { DEV_ENVS_PERSIST_KEY, getStorageData } from '@2060/services/localStorage'
import { logError } from '@2060/utils'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'
import { DevEnvsObject } from '@2060/utils/developer'

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
    const thread = findOrCreateChatThread(realm, connection)
    if (proofRecord.state === ProofState.RequestReceived) {
      const [vpResponseChatEntry] = findAllByAssociatedRecordId(
        realm,
        proofRecord.id,
        ChatEntryType.VPResponse,
      )
      // if exists a VPResponse related to this proofRecord, update its proofState to RequestReceived
      if (vpResponseChatEntry) {
        const newChatEntryMetadata = {
          ...vpResponseChatEntry.metadata,
          proofState: proofRecord.state,
        } as VPResponseMetadata
        updateMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
        try {
          const requestedCredentials = await agent.proofs.selectCredentialsForRequest({
            proofRecordId: proofRecord.id,
          })
          await agent.proofs.acceptRequest({
            proofRecordId: proofRecord.id,
            proofFormats: { anoncreds: requestedCredentials.proofFormats.anoncreds },
          })
        } catch (e) {
          logError(`Error accepting proof request ${e}`)
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
          updateThread(realm, thread.id, { lastChatEntry: vpRequestChatEntry })
        }
        if (thread.id !== activeChatThreadId) {
          addUnread(realm, thread.id, 1)
        }
      }
    } else if (
      proofRecord.state === ProofState.PresentationSent ||
      proofRecord.state === ProofState.Declined ||
      proofRecord.state === ProofState.Abandoned
    ) {
      let [vpResponseChatEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPResponse)
      // If a presentation has been effectively done, create an additional chat entry
      // including the preview of the credentials that have been sent
      if (proofRecord.state === ProofState.PresentationSent) {
        const associatedMessageId = (await agent.proofs.findPresentationMessage(proofRecord.id))?.id

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
          updateThread(realm, thread.id, { lastChatEntry: vpResponseChatEntry })
        }
      }
      // Update the metadata of the chat entry if exists with the new proof state
      if (vpResponseChatEntry) {
        const newChatEntryMetadata = {
          ...vpResponseChatEntry.metadata,
          proofState: proofRecord.state,
        } as VPResponseMetadata
        updateMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
      }
      // Find any VP Request entry associated to this proof record and mark it as replied
      const [vpRequestEntry] = findAllByAssociatedRecordId(realm, proofRecord.id, ChatEntryType.VPRequest)
      if (vpRequestEntry) {
        const metadata = { ...vpRequestEntry.metadata, proofState: proofRecord.state, replied: true }
        updateMetadata(realm, vpRequestEntry.id, metadata)
      }
    } else if (proofRecord.state === ProofState.ProposalReceived) {
      const presentedCredentials: VPResponsePresentedCredential[] = []
      const attributes: Record<string, string> = {}
      try {
        const formatData = await agent.proofs.getFormatData(proofRecord.id)
        const requestedAttributes = formatData.proposal?.anoncreds?.requested_attributes
        if (requestedAttributes) {
          for (const attributeId in requestedAttributes) {
            const key = requestedAttributes?.[attributeId]?.name ?? 'unknown'
            attributes[key] = ''
          }
          const firstAttribute = Object.values(requestedAttributes)[0]

          if (firstAttribute.restrictions?.length) {
            const credentialDefinitionId = firstAttribute.restrictions[0].cred_def_id

            if (credentialDefinitionId) {
              const persistedEnvVariables = (await getStorageData(DEV_ENVS_PERSIST_KEY)) as DevEnvsObject
              const serviceInfo = await getServiceInfo({
                did: credentialDefinitionId,
                trustedServiceResolverBaseUrl: persistedEnvVariables.TRUSTED_SERVICE_RESOLVER_BASE_URL,
              })
              const credentialDefinition = (
                await agent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId)
              ).credentialDefinition
              const schemaId = credentialDefinition?.schemaId
              const schemaName = schemaId
                ? ((await agent.modules.anoncreds.getSchema(schemaId)).schema?.name ?? '')
                : ''
              const credentialMainInfo: CredentialMainInfo = {
                id: '',
                recordId: '',
                createdAt: new Date(),
                schemaName: sanitizeString(schemaName),
                issuer: {
                  id: credentialDefinition?.issuerId ?? '',
                  name: serviceInfo?.name ?? credentialDefinitionId,
                  logoUrl: serviceInfo?.logoUrl,
                  status: serviceInfo?.status ?? 'notFound',
                },
              }
              presentedCredentials.push({ mainInfo: credentialMainInfo, attributes })
            }
          }
        }
      } catch (e) {
        logError(`Error getting credential presented info ${e}`)
      }

      const metadata: VPResponseMetadata = {
        proofState: proofRecord.state,
        presentedCredentials: JSON.stringify(presentedCredentials),
      }
      const chatEntry = createChatEntry(realm, {
        associatedRecordId: proofRecord.id,
        chatThreadId: thread.id,
        type: ChatEntryType.VPResponse,
        role: ChatEntryRole.Receiver,
        state: ChatEntryState.Created,
        createdAt: new Date().getTime(),
        metadata,
        associatedMessageId: proofRecord.threadId,
      })
      updateThread(realm, thread.id, { lastChatEntry: chatEntry })
      if (thread.id !== activeChatThreadId) {
        addUnread(realm, thread.id, 1)
      }
    } else if (proofRecord.state === ProofState.PresentationReceived) {
      const formatData = await agent.proofs.getFormatData(proofRecord.id)
      const revealedAttributes = formatData.presentation?.anoncreds?.requested_proof.revealed_attrs
      const attributesIds = formatData.proposal?.anoncreds?.requested_attributes
      const attributes: Record<string, string> = {}
      for (const attributeId in revealedAttributes) {
        const item = revealedAttributes[attributeId]
        const key = attributesIds?.[attributeId]?.name ?? 'unknown'
        attributes[key] = item.raw
      }
      const [vpResponseChatEntry] = findAllByAssociatedRecordId(
        realm,
        proofRecord.id,
        ChatEntryType.VPResponse,
      )
      if (vpResponseChatEntry) {
        const currentMetadata = vpResponseChatEntry.metadata as VPResponseMetadata
        const presentedCredentials = JSON.parse(
          currentMetadata.presentedCredentials,
        ) as VPResponsePresentedCredential[]
        if (!presentedCredentials.length) return
        const presentedCredentialInfoUpdated: VPResponsePresentedCredential = {
          mainInfo: { ...presentedCredentials[0].mainInfo },
          attributes,
        }
        const newChatEntryMetadata = {
          ...vpResponseChatEntry.metadata,
          presentedCredentials: JSON.stringify([presentedCredentialInfoUpdated]),
        } as VPResponseMetadata
        updateMetadata(realm, vpResponseChatEntry.id, newChatEntryMetadata)
      }
    }
  }
}
