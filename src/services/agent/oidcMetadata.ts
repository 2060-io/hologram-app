import type { W3cCredentialRecord } from '@credo-ts/core'
import type {
  CredentialsSupportedDisplay,
  CredentialSupportedJwtVcJsonLdAndLdpVc,
  EndpointMetadata,
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

function extractOpenId4VcCredentialMetadata(
  credentialMetadata: CredentialSupportedJwtVcJsonLdAndLdpVc,
  serverMetadata: EndpointMetadata,
) {
  return {
    credential: {
      display: credentialMetadata.display,
      order: credentialMetadata.order,
      credentialSubject: credentialMetadata.id, // TODO: proper credentialSubject
    },
    issuer: {
      // TODO: display
      id: serverMetadata.issuer,
    },
  }
}

/**
 * Gets the OpenId4Vc credential metadata from the given W3C credential record.
 */
export function getOpenId4VcCredentialMetadata(
  w3cCredentialRecord: W3cCredentialRecord,
): OpenId4VcCredentialMetadata | null {
  return w3cCredentialRecord.metadata.get(openId4VcCredentialMetadataKey)
}

/**
 * Sets the OpenId4Vc credential metadata on the given W3C credential record.
 *
 * NOTE: this does not save the record.
 */
export function setOpenId4VcCredentialMetadata(
  w3cCredentialRecord: W3cCredentialRecord,
  credentialMetadata: CredentialSupportedJwtVcJsonLdAndLdpVc,
  serverMetadata: EndpointMetadata,
) {
  w3cCredentialRecord.metadata.set(
    openId4VcCredentialMetadataKey,
    extractOpenId4VcCredentialMetadata(credentialMetadata, serverMetadata),
  )
}
