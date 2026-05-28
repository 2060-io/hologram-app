import { W3cCredentialRecord } from '@credo-ts/core'
import { DidCommCredentialExchangeRecord, DidCommProofExchangeRecord } from '@credo-ts/didcomm'

import { ServiceStatus } from '@src/model/ServiceInfo'

interface DidCommCredentialDisplayMetadata {
  issuedAt: number
  issuerId: string
  issuerName: string
  issuerStatus: ServiceStatus
  issuerLogoUrl: string
  schemaName: string
}

export interface DidCommPresentationDisplayMetadata {
  credentials: { type: string; credentialId: string }[]
}

const didCommCredentialDisplayMetadataKey = '_2060/credentialDisplayMetadata'
const didCommPresentationDisplayMetadataKey = '_2060/presentationDisplayMetadata'

export function getDidCommCredentialDisplayMetadata(
  credentialExchangeRecord: DidCommCredentialExchangeRecord | W3cCredentialRecord
): DidCommCredentialDisplayMetadata | null {
  return credentialExchangeRecord.metadata.get(didCommCredentialDisplayMetadataKey)
}

export function setDidCommCredentialMetadata(
  credentialExchangeRecord: DidCommCredentialExchangeRecord | W3cCredentialRecord,
  metadata: DidCommCredentialDisplayMetadata
) {
  credentialExchangeRecord.metadata.set(didCommCredentialDisplayMetadataKey, metadata)
}

export function getDidCommPresentationDisplayMetadata(
  proofExchangeRecord: DidCommProofExchangeRecord
): DidCommPresentationDisplayMetadata | null {
  return proofExchangeRecord.metadata.get(didCommPresentationDisplayMetadataKey)
}

export function setDidCommPresentationMetadata(
  proofExchangeRecord: DidCommProofExchangeRecord,
  metadata: DidCommPresentationDisplayMetadata
) {
  proofExchangeRecord.metadata.set(didCommPresentationDisplayMetadataKey, metadata)
}
