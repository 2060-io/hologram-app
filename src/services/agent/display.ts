/* eslint-disable max-len */
import type { OpenId4VcCredentialMetadata } from './oidcMetadata'
import type { W3cCredentialJson, W3cIssuerJson } from './types'

import { AnonCredsProofRequestRestriction } from '@credo-ts/anoncreds'
import {
  W3cCredentialRecord,
  SdJwtVcRecord,
  W3cCredentialRepository,
  ClaimFormat,
  JsonTransformer,
  CredentialState,
  MdocRecord,
} from '@credo-ts/core'
import { OpenId4VciResolvedCredentialOffer } from '@credo-ts/openid4vc'
import { TrustResolutionOutcome } from '@verana-labs/verre'

import { MobileAgent } from './MobileAgent'
import { getDidCommCredentialDisplayMetadata } from './RecordMetadata'
import { getOpenId4VcCredentialMetadata } from './oidcMetadata'

import { IssuerInfo, VerifierInfo } from '@2060/model/ServiceInfo'

export type CredentialMainInfo = {
  id: string
  recordId: string
  createdAt?: Date
  schemaName: string
  issuer: IssuerInfo
}

export type CredentialDetailsForDisplay = {
  mainInfo: CredentialMainInfo
  attributes: Record<string, unknown>
}

type JffW3cCredentialJson = W3cCredentialJson & {
  name?: string
  description?: string
  credentialBranding?: {
    backgroundColor?: string
  }

  issuer:
    | string
    | (W3cIssuerJson & {
        name?: string
        iconUrl?: string
        logoUrl?: string
        image?: string | { id?: string; type?: 'Image' }
      })
}

interface DisplayImage {
  url?: string
  altText?: string
}

interface CredentialDisplay {
  name: string
  locale?: string
  description?: string
  textColor?: string
  backgroundColor?: string
  backgroundImage?: DisplayImage
  issuer: CredentialIssuerDisplay
}

interface CredentialIssuerDisplay {
  name: string
  locale?: string
  logo?: DisplayImage
}

/**
 * Converts a camelCase string to a sentence format (first letter capitalized, rest in lower case).
 * i.e. sanitizeString("helloWorld")  // returns: 'Hello world'
 */
export function sanitizeString(str?: string) {
  if (!str) return ''

  const result = str.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  let words = result.split(/[\s_-]+/)
  words = words.map((word, index) => {
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    } else {
      return word.charAt(0).toLowerCase() + word.slice(1)
    }
  })
  return words.join(' ')
}

function findDisplay<Display extends { locale?: string }>(display?: Display[]): Display | undefined {
  if (!display) return undefined

  let item = display.find(d => d.locale?.startsWith('en-'))
  if (!item) item = display.find(d => !d.locale)
  if (!item) item = display[0]

  return item
}

function getIssuerDisplay(
  credential: W3cCredentialJson,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null,
): CredentialIssuerDisplay {
  const issuerDisplay: Partial<CredentialIssuerDisplay> = {}

  // Try to extract from openid metadata first
  if (openId4VcMetadata) {
    const openidIssuerDisplay = findDisplay(openId4VcMetadata.issuer.display)

    if (openidIssuerDisplay) {
      issuerDisplay.name = openidIssuerDisplay.name

      if (openidIssuerDisplay.logo) {
        issuerDisplay.logo = {
          url: openidIssuerDisplay.logo?.url,
          altText: openidIssuerDisplay.logo?.alt_text,
        }
      }
    }

    // If the credentialDisplay contains a logo, and the issuerDisplay does not, use the logo from the credentialDisplay
    const openidCredentialDisplay = findDisplay(openId4VcMetadata.credential.display)
    if (openidCredentialDisplay && !issuerDisplay.logo && openidCredentialDisplay.logo) {
      issuerDisplay.logo = {
        url: openidCredentialDisplay.logo?.url,
        altText: openidCredentialDisplay.logo?.alt_text,
      }
    }
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson
  const issuerJson = typeof jffCredential.issuer === 'string' ? undefined : jffCredential.issuer

  // Issuer Display from JFF
  if (!issuerDisplay.logo || !issuerDisplay.logo.url) {
    if (issuerJson?.logoUrl) {
      issuerDisplay.logo = {
        url: issuerJson?.logoUrl,
      }
    } else if (issuerJson?.image) {
      issuerDisplay.logo = {
        url: typeof issuerJson.image === 'string' ? issuerJson.image : issuerJson.image.id,
      }
    }
  }

  // Issuer name from JFF
  if (!issuerDisplay.name) {
    issuerDisplay.name = issuerJson?.name
  }

  // Last fallback: use issuer id from openid4vc
  if (!issuerDisplay.name && openId4VcMetadata?.issuer.id) {
    issuerDisplay.name = openId4VcMetadata.issuer.id
  }

  return {
    ...issuerDisplay,
    name: issuerDisplay.name ?? 'Unknown',
  }
}

function getW3cCredentialDisplay(
  credential: W3cCredentialJson,
  openId4VcMetadata?: OpenId4VcCredentialMetadata | null,
) {
  const credentialDisplay: Partial<CredentialDisplay> = {}

  if (openId4VcMetadata) {
    const openidCredentialDisplay = findDisplay(openId4VcMetadata.credential.display)

    if (openidCredentialDisplay) {
      credentialDisplay.name = openidCredentialDisplay.name
      credentialDisplay.description = openidCredentialDisplay.description
      credentialDisplay.textColor = openidCredentialDisplay.text_color
      credentialDisplay.backgroundColor = openidCredentialDisplay.background_color

      if (openidCredentialDisplay.background_image) {
        credentialDisplay.backgroundImage = {
          url: openidCredentialDisplay.background_image.url,
          altText: openidCredentialDisplay.background_image.alt_text,
        }
      }

      // NOTE: logo is used in issuer display (not sure if that's right though)
    }
  }

  // If openid metadata is not available, try to extract display metadata from the credential based on JFF metadata
  const jffCredential = credential as JffW3cCredentialJson

  if (!credentialDisplay.name) {
    credentialDisplay.name = jffCredential.name
  }

  // If there's no name for the credential, we extract it from the last type
  // and sanitize it. This is not optimal. But provides at least something.
  if (!credentialDisplay.name && jffCredential.type.length > 1) {
    const lastType = jffCredential.type[jffCredential.type.length - 1]
    if (lastType && !lastType.startsWith('http')) {
      credentialDisplay.name = sanitizeString(lastType)
    }
  }

  return {
    ...credentialDisplay,
    // Last fallback, if there's really no name for the credential, we use a generic name
    // TODO: use on-device AI to determine a name for the credential based on the credential data
    name: credentialDisplay.name ?? 'Credential',
  }
}

type CredentialDetailsFromExchange = {
  state: CredentialState
  details: CredentialDetailsForDisplay
}

export async function getCredentialDetailsFromExchange(
  agent: MobileAgent,
  credentialExchangeRecordId: string,
): Promise<CredentialDetailsFromExchange> {
  const credentialExchangeRecord = await agent.credentials.getById(credentialExchangeRecordId)

  // Credential already issued: take info from it
  if (credentialExchangeRecord.credentials[0]) {
    const credentialRecord = await agent.w3cCredentials.getCredentialRecordById(
      credentialExchangeRecord.credentials[0].credentialRecordId,
    )
    const details = getCredentialDetailsForDisplay(credentialRecord)
    return { details, state: credentialExchangeRecord.state }
  }

  // Credential not yet issued: take info from offer
  const formatData = await agent.credentials.getFormatData(credentialExchangeRecordId)

  const attributes: Record<string, string> = {}

  if (formatData.offerAttributes) {
    for (const attribute of formatData.offerAttributes) {
      attributes[attribute.name] = attribute.value
    }
  }

  const displayMetadata = getDidCommCredentialDisplayMetadata(credentialExchangeRecord)

  return {
    details: {
      mainInfo: {
        id: '', // Credential not yet received
        recordId: '',
        createdAt: credentialExchangeRecord.createdAt,
        schemaName: sanitizeString(displayMetadata?.schemaName),
        issuer: {
          id: displayMetadata?.issuerId ?? '',
          logoUrl: displayMetadata?.issuerLogoUrl,
          name: displayMetadata?.issuerName ?? '',
          status: displayMetadata?.issuerStatus ?? TrustResolutionOutcome.INVALID,
        },
      },
      attributes,
    },
    state: credentialExchangeRecord.state,
  }
}

export function getCredentialMainInfo(
  credentialRecord: W3cCredentialRecord | SdJwtVcRecord | MdocRecord,
  //@ts-expect-error It incorrectly complains about no return, when both cases are fully covered
): CredentialMainInfo {
  if (credentialRecord instanceof W3cCredentialRecord) {
    const credential = JsonTransformer.toJSON(
      credentialRecord.credential.claimFormat === ClaimFormat.JwtVc
        ? credentialRecord.credential.credential
        : credentialRecord.credential,
    ) as W3cCredentialJson

    // Give priority to any metadata created by a DIDComm credential exchange
    const didcommDisplayMetadata = getDidCommCredentialDisplayMetadata(credentialRecord)
    if (didcommDisplayMetadata) {
      return {
        id: credentialRecord.id,
        recordId: credentialRecord.id,
        createdAt: new Date(didcommDisplayMetadata.issuedAt),
        schemaName: sanitizeString(didcommDisplayMetadata?.schemaName),
        issuer: {
          id: didcommDisplayMetadata?.issuerId ?? '',
          logoUrl: didcommDisplayMetadata?.issuerLogoUrl,
          name: didcommDisplayMetadata?.issuerName ?? '',
          status: didcommDisplayMetadata?.issuerStatus ?? 'trusted',
        },
      }
    }

    const openId4VcMetadata = getOpenId4VcCredentialMetadata(credentialRecord)
    const issuerDisplay = getIssuerDisplay(credential, openId4VcMetadata)
    const credentialDisplay = getW3cCredentialDisplay(credential, openId4VcMetadata)

    return {
      id: credentialRecord.id,
      recordId: credentialRecord.id,
      createdAt: credentialRecord.createdAt,
      schemaName: credentialDisplay.name,
      issuer: {
        id: credential.issuer.id,
        name: issuerDisplay.name,
        logoUrl: issuerDisplay.logo?.url,
        status: TrustResolutionOutcome.INVALID,
      },
    }
  }
}

export function getOfferedCredentialDetailsForDisplay(
  data: OpenId4VciResolvedCredentialOffer,
): CredentialDetailsForDisplay {
  const credential = data.offeredCredentials[0]

  if (!credential) throw new Error('No credential offered')

  // FIXME: Populate with actual credential details
  return {
    mainInfo: {
      createdAt: new Date(),
      id: 'id',
      issuer: { id: 'issuerId', name: 'issuerName', status: TrustResolutionOutcome.INVALID },
      recordId: 'recordId',
      schemaName: 'Schema',
    },
    attributes: {},
  }
}

export function getCredentialAttributes(credentialRecord: W3cCredentialRecord) {
  let attributes: Record<string, unknown> = {}
  if (credentialRecord.type === W3cCredentialRecord.type) {
    const credential = JsonTransformer.toJSON(
      credentialRecord.credential.claimFormat === ClaimFormat.JwtVc
        ? credentialRecord.credential.credential
        : credentialRecord.credential,
    ) as W3cCredentialJson

    // FIXME: support credential with multiple subjects
    attributes = Array.isArray(credential.credentialSubject)
      ? (credential.credentialSubject[0] ?? {})
      : credential.credentialSubject
  }
  return attributes
}

export function getCredentialDetailsForDisplay(
  credentialRecord: W3cCredentialRecord,
): CredentialDetailsForDisplay {
  return {
    mainInfo: getCredentialMainInfo(credentialRecord),
    attributes: getCredentialAttributes(credentialRecord),
  }
}

type CredentialMatch = {
  credentialMainInfo: CredentialMainInfo
}

export type RequestedCredentialItem = {
  id: string
  schemaName: string
  issuerName?: string
  attributes: string[]
  matches?: CredentialMatch[]
}

const getRequestedCredentialTypeFromRestrictions = async (
  agent: MobileAgent,
  restrictions: AnonCredsProofRequestRestriction[],
) => {
  // Find schemaId or credentialDefinitionId among the restrictions in order to determine the schema name
  let schemaName: string | undefined, issuerName: string | undefined
  for (const restriction of restrictions) {
    if (restriction.schema_name) {
      schemaName = sanitizeString(restriction.schema_name)
    }

    let schemaId: string | undefined
    if (restriction.cred_def_id) {
      const credentialDefinitionResult = await agent.modules.anoncreds.getCredentialDefinition(
        restriction.cred_def_id,
      )
      schemaId = credentialDefinitionResult.credentialDefinition?.schemaId
    }

    if (!schemaId) schemaId = restriction.schema_id
    if (schemaId) {
      const schemaResult = await agent.modules.anoncreds.getSchema(schemaId)
      schemaName = sanitizeString(schemaResult.schema?.name)
    }
    issuerName =
      restriction.issuer_did ??
      restriction.issuer_id ??
      restriction.schema_issuer_did ??
      restriction.schema_issuer_id
  }

  return {
    issuerName,
    schemaName,
  }
}

/**
 * Gets a presentation request ready for display, optionally including all credentials in the wallet that matches the required
 * data.
 *
 * Due to the computation required to process all the information, it is intended to be used with includeMatches = false for chat
 * entry list, and includeMatches = true when showing the credential selection screen
 *
 * @param options
 * @returns
 */
export async function getPresentationRequestForDisplay(options: {
  agent: MobileAgent
  proofRecordId: string
  verifierInfo: VerifierInfo
  includeMatches?: boolean
}) {
  const { agent, proofRecordId, includeMatches } = options

  const formatData = await agent.proofs.getFormatData(proofRecordId)
  const data = formatData.request?.anoncreds ?? formatData.request?.indy
  if (!data) throw new Error(`No available data for proof record with id ${proofRecordId}`)

  const availableCredentials = await agent.proofs.getCredentialsForRequest({ proofRecordId })
  const availableCredentialsData =
    availableCredentials.proofFormats.anoncreds ?? availableCredentials.proofFormats.indy

  const credentialRepository = agent.dependencyManager.resolve(W3cCredentialRepository)

  const requestedCredentials: RequestedCredentialItem[] = []

  // Attributes
  for (const attributeName in data.requested_attributes) {
    const item = data.requested_attributes[attributeName]
    const attributes = []
    if (item.name) attributes.push(sanitizeString(item.name))
    if (item.names) attributes.push(...item.names.map(sanitizeString))

    let matches: CredentialMatch[] | undefined
    if (includeMatches) {
      matches = []
      if (availableCredentialsData) {
        for (const match of availableCredentialsData.attributes[attributeName]) {
          const credentialRecord = await credentialRepository.findById(agent.context, match.credentialId)
          if (credentialRecord) {
            matches.push({
              credentialMainInfo: getCredentialMainInfo(credentialRecord),
            })
          }
        }
      }
    }

    const { schemaName, issuerName } = await getRequestedCredentialTypeFromRestrictions(
      agent,
      item.restrictions ?? [],
    )
    requestedCredentials.push({
      id: attributeName,
      schemaName: schemaName ?? sanitizeString(attributeName),
      issuerName,
      attributes,
      matches,
    })
  }

  // Predicates
  for (const predicateName in data.requested_predicates) {
    const item = data.requested_predicates[predicateName]
    const attributes = []
    if (item.name) attributes.push(sanitizeString(item.name))

    let matches: CredentialMatch[] | undefined
    if (includeMatches) {
      matches = []
      if (availableCredentialsData) {
        for (const match of availableCredentialsData.predicates[predicateName]) {
          const credentialRecord = await credentialRepository.findById(agent.context, match.credentialId)

          if (credentialRecord) {
            matches.push({
              credentialMainInfo: getCredentialMainInfo(credentialRecord),
            })
          }
        }
      }
    }

    const { schemaName, issuerName } = await getRequestedCredentialTypeFromRestrictions(
      agent,
      item.restrictions ?? [],
    )
    requestedCredentials.push({
      id: predicateName,
      attributes,
      schemaName: schemaName ?? sanitizeString(predicateName),
      issuerName,
      matches,
    })
  }

  return { requestedCredentials, verifier: options.verifierInfo }
}
