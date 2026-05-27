import {
  AnonCredsDidCommProofFormat,
  AnonCredsPresentationPreviewAttribute,
  AnonCredsSelectedCredentials,
  LegacyIndyDidCommProofFormat,
} from '@credo-ts/anoncreds'
import { DidCommMessage, DidCommProofExchangeRecord, DidCommProofFormatPayload } from '@credo-ts/didcomm'
import { logError } from '@src/utils'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import { getServiceInfo } from '../trustResolution'
import { CredentialMainInfo, sanitizeString } from './display'
import { MobileAgent } from './MobileAgent'
import { acceptProofRequestOrReportNoCompatible } from './proofPresentation'
import { DidCommPresentationDisplayMetadata, setDidCommPresentationMetadata } from './RecordMetadata'

type SelectedCredentials = {
  [referent: string]: string
}

interface PresentProofOptions {
  agent: MobileAgent
  proofRecordId: string
  selectedCredentials: SelectedCredentials
}

export async function presentProof(options: PresentProofOptions) {
  const { agent, proofRecordId, selectedCredentials } = options

  // get format data to know where to populate the selection
  const { proofFormats } = await agent.didcomm.proofs.getCredentialsForRequest({
    proofExchangeRecordId: proofRecordId,
    proofFormats: { anoncreds: { filterByNonRevocationRequirements: true } },
  })

  let anoncreds: AnonCredsSelectedCredentials | undefined, indy: AnonCredsSelectedCredentials | undefined

  const metadata: DidCommPresentationDisplayMetadata = { credentials: [] }

  // Search for referent among the attributes and the predicates, and build the selection object with
  // the match that corresponds to the selected credential id
  for (const referent in selectedCredentials) {
    const credentialId = selectedCredentials[referent]

    for (const attributeName in proofFormats.anoncreds?.attributes) {
      if (attributeName === referent) {
        if (!anoncreds) anoncreds = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-expect-error Ignoring TS errors as we have just defined the object
        anoncreds.attributes[attributeName] = proofFormats.anoncreds.attributes[attributeName].find(
          (item) => item.credentialId === credentialId
        )
        metadata.credentials.push({ type: 'anoncreds', credentialId })
        break
      }
    }

    for (const predicateName in proofFormats.anoncreds?.predicates) {
      if (predicateName === referent) {
        if (!anoncreds) anoncreds = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-expect-error Ignoring TS errors as we have just defined the object
        anoncreds.predicates[predicateName] = proofFormats.anoncreds.predicates[predicateName].find(
          (item) => item.credentialId === credentialId
        )
        metadata.credentials.push({ type: 'anoncreds', credentialId })
        break
      }
    }

    for (const attributeName in proofFormats.indy?.attributes) {
      if (attributeName === referent) {
        if (!indy) indy = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-expect-error Ignoring TS errors as we have just defined the object
        indy.attributes[attributeName] = proofFormats.indy.attributes[attributeName].find(
          (item) => item.credentialId === credentialId
        )
        metadata.credentials.push({ type: 'indy', credentialId })
        break
      }
    }

    for (const predicateName in proofFormats.indy?.predicates) {
      if (predicateName === referent) {
        if (!indy) indy = { attributes: {}, predicates: {}, selfAttestedAttributes: {} }
        // @ts-expect-error Ignoring TS errors as we have just defined the object
        indy.predicates[predicateName] = proofFormats.indy.predicates[predicateName].find(
          (item) => item.credentialId === credentialId
        )
        metadata.credentials.push({ type: 'indy', credentialId })
        break
      }
    }
  }

  const proofFormatPayload: DidCommProofFormatPayload<
    (LegacyIndyDidCommProofFormat | AnonCredsDidCommProofFormat)[],
    'acceptRequest'
  > = {}
  if (anoncreds) proofFormatPayload.anoncreds = anoncreds
  if (indy) proofFormatPayload.indy = indy

  // Update record metadata
  const proofRecord = await agent.didcomm.proofs.getById(proofRecordId)
  setDidCommPresentationMetadata(proofRecord, metadata)

  await agent.didcomm.proofs.update(proofRecord)

  await acceptProofRequestOrReportNoCompatible({
    agent,
    proofRecordId,
    proofFormats: proofFormatPayload,
  })
}

/**
 * Initiate a new presentation exchange as prover by sending an out of band proof proposal message
 *
 * @param options multiple properties like protocol version, proof Formats to build the proof request
 * @returns the message itself and the proof record associated with the sent request message
 */
export async function createProofProposal(options: {
  agent: MobileAgent
  attributes: AnonCredsPresentationPreviewAttribute[]
}): Promise<{
  message: DidCommMessage
  proofRecord: DidCommProofExchangeRecord
}> {
  const { attributes, agent } = options

  return await agent.didcomm.proofs.createProofProposal({
    proofFormats: { anoncreds: { attributes } },
    protocolVersion: 'v2',
  })
}

export const proposalGetCredentialInfo = async (options: { agent: MobileAgent; proofRecordId: string }) => {
  let credentialMainInfo: CredentialMainInfo | null = null
  try {
    const { agent, proofRecordId } = options
    const formatData = await agent.didcomm.proofs.getFormatData(proofRecordId)
    const requestedAttributes = formatData.proposal?.anoncreds?.requested_attributes
    if (requestedAttributes && Object.keys(requestedAttributes).length) {
      const firstAttribute = Object.values(requestedAttributes)[0]

      if (firstAttribute.restrictions?.length) {
        const credentialDefinitionId = firstAttribute.restrictions[0].cred_def_id

        if (credentialDefinitionId) {
          const serviceInfo = await getServiceInfo({
            agent: agent,
            did: credentialDefinitionId,
          })
          const credentialDefinition = (await agent.modules.anoncreds.getCredentialDefinition(credentialDefinitionId))
            .credentialDefinition
          const schemaId = credentialDefinition?.schemaId
          const schemaName = schemaId ? ((await agent.modules.anoncreds.getSchema(schemaId)).schema?.name ?? '') : ''
          credentialMainInfo = {
            id: '',
            recordId: '',
            schemaName: sanitizeString(schemaName),
            issuer: {
              id: credentialDefinition?.issuerId ?? '',
              name: serviceInfo?.name ?? credentialDefinitionId,
              logoUrl: serviceInfo?.logoUrl,
              status: serviceInfo?.status ?? TrustResolutionOutcome.INVALID,
            },
          }
        }
      }
    }
  } catch (error) {
    logError('Error getting credential info', error)
  } finally {
    return credentialMainInfo
  }
}

export const proposalGetCredentialAttributes = async (options: { agent: MobileAgent; proofRecordId: string }) => {
  const { agent, proofRecordId } = options
  const attributes: Record<string, string> = {}
  const formatData = await agent.didcomm.proofs.getFormatData(proofRecordId)
  const requestedAttributes = formatData.proposal?.anoncreds?.requested_attributes
  if (requestedAttributes && Object.keys(requestedAttributes).length) {
    for (const attributeId in requestedAttributes) {
      const key = requestedAttributes?.[attributeId]?.name ?? 'unknown'
      attributes[key] = ''
    }
  }
  return attributes
}

export const getCredentialRevealedAttributes = async (options: { agent: MobileAgent; proofRecordId: string }) => {
  const { agent, proofRecordId } = options
  const formatData = await agent.didcomm.proofs.getFormatData(proofRecordId)
  const revealedAttributes = formatData.presentation?.anoncreds?.requested_proof.revealed_attrs
  const attributesIds = formatData.proposal?.anoncreds?.requested_attributes
  const attributes: Record<string, string> = {}
  for (const attributeId in revealedAttributes) {
    const item = revealedAttributes[attributeId]
    const key = attributesIds?.[attributeId]?.name ?? 'unknown'
    attributes[key] = item.raw
  }
  return attributes
}
