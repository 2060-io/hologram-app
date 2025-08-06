import { CredentialExchangeRecord, ProofExchangeRecord, W3cCredentialRecord } from '@credo-ts/core'

import { ServiceStatus } from '@2060/model/ServiceInfo'

export interface DidCommCredentialDisplayMetadata {
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
  credentialExchangeRecord: CredentialExchangeRecord | W3cCredentialRecord,
): DidCommCredentialDisplayMetadata | null {
  return credentialExchangeRecord.metadata.get(didCommCredentialDisplayMetadataKey)
}

export function setDidCommCredentialMetadata(
  credentialExchangeRecord: CredentialExchangeRecord | W3cCredentialRecord,
  metadata: DidCommCredentialDisplayMetadata,
) {
  credentialExchangeRecord.metadata.set(didCommCredentialDisplayMetadataKey, metadata)
}

export function getDidCommPresentationDisplayMetadata(
  proofExchangeRecord: ProofExchangeRecord,
): DidCommPresentationDisplayMetadata | null {
  return proofExchangeRecord.metadata.get(didCommPresentationDisplayMetadataKey)
}

export function setDidCommPresentationMetadata(
  proofExchangeRecord: ProofExchangeRecord,
  metadata: DidCommPresentationDisplayMetadata,
) {
  proofExchangeRecord.metadata.set(didCommPresentationDisplayMetadataKey, metadata)
}
