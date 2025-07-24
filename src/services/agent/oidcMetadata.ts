import type { W3cCredentialRecord } from '@credo-ts/core'
import type {
  CredentialsSupportedDisplay,
  IssuerCredentialSubject,
  MetadataDisplay,
} from '@sphereon/oid4vci-common'

export interface OpenId4VcCredentialMetadata {
  credential: {
    display?: CredentialsSupportedDisplay[]
    order?: string[]
    credentialSubject: IssuerCredentialSubject
  }
  issuer: {
    display?: MetadataDisplay[]
    id: string
  }
}

const openId4VcCredentialMetadataKey = '_paradym/openId4VcCredentialMetadata'

/**
 * Gets the OpenId4Vc credential metadata from the given W3C credential record.
 */
export function getOpenId4VcCredentialMetadata(
  w3cCredentialRecord: W3cCredentialRecord,
): OpenId4VcCredentialMetadata | null {
  return w3cCredentialRecord.metadata.get(openId4VcCredentialMetadataKey)
}
