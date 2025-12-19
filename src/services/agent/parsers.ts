import {
  DifPexCredentialsForRequest,
  DifPresentationExchangeService,
  Agent,
  KeyDidCreateOptions,
  TypedArrayEncoder,
  DidKey,
} from '@credo-ts/core'
import { OpenId4VpVerifiedAuthorizationRequest } from '@credo-ts/openid4vc'

import { MobileAgent } from './MobileAgent'

enum QrTypes {
  OPENID_INITIATE_ISSUANCE = 'openid-initiate-issuance://',
  OPENID_CREDENTIAL_OFFER = 'openid-credential-offer://',
  OPENID = 'openid://',
  OPENID_VC = 'openid-vc://',
  OPENIDVP = 'openid4vp://',
}

export const isOpenIdCredentialOffer = (url: string) => {
  return url.startsWith(QrTypes.OPENID_INITIATE_ISSUANCE) || url.startsWith(QrTypes.OPENID_CREDENTIAL_OFFER)
}

export const isOpenIdPresentationRequest = (url: string) => {
  return (
    url.startsWith(QrTypes.OPENID) || url.startsWith(QrTypes.OPENID_VC) || url.startsWith(QrTypes.OPENIDVP)
  )
}

export const receiveCredentialFromOpenId4VciOffer = async ({
  agent,
  data,
}: {
  agent: MobileAgent
  data: string
}) => {
  if (!isOpenIdCredentialOffer(data)) throw new Error('URI does not start with OpenID issuance prefix.')

  // FIXME: Check the parameters and returned value of this new API method
  const offer = await agent.modules.openId4VcHolder.resolveCredentialOffer(data)

  const records = offer.offeredCredentials

  if (!records || !records.length) throw new Error('Error storing credential using pre authorized flow.')

  //return records[0]
  return offer
}

const urlRegex = new RegExp('^(.*:)//([A-Za-z0-9-.]+)(:[0-9]+)?(.*)$')

function getHostNameFromUrl(url: string) {
  const parts = urlRegex.exec(url)
  return parts ? parts[2] : undefined
}

export const getCredentialsForProofRequest = async ({
  data,
  agent,
}: {
  data: string
  agent: MobileAgent
}) => {
  if (!isOpenIdPresentationRequest(data)) throw new Error('URI does not start with OpenID prefix.')

  const request = await agent.modules.openId4VcHolder.resolveSiopAuthorizationRequest(data)
  return {
    selectResults: request.presentationExchange?.credentialsForRequest,
    verifiedAuthorizationRequest: request.authorizationRequest,
    verifierHostName: request.authorizationRequest.responseURI
      ? getHostNameFromUrl(request.authorizationRequest.responseURI)
      : '',
  }
}

export const shareProof = async ({
  agent,
  verifiedAuthorizationRequest,
  selectResults,
}: {
  agent: MobileAgent
  verifiedAuthorizationRequest: OpenId4VpVerifiedAuthorizationRequest
  selectResults: DifPexCredentialsForRequest
  submissionEntryIndexes: number[]
}) => {
  if (!selectResults.areRequirementsSatisfied) {
    throw new Error('Requirements are not satisfied.')
  }

  const presentationExchangeService = agent.dependencyManager.resolve(DifPresentationExchangeService)

  const selectedCredentials = presentationExchangeService.selectCredentialsForRequest(selectResults)

  await agent.modules.openId4VcHolder.acceptSiopAuthorizationRequest({
    authorizationRequest: verifiedAuthorizationRequest,
    presentationExchange: {
      credentials: selectedCredentials,
    },
  })
}

export async function createDidKidVerificationMethod(agent: Agent, secretKey?: string) {
  const didCreateResult = await agent.dids.create<KeyDidCreateOptions>({
    method: 'key',
    options: { keyType: KeyType.Ed25519 },
    secret: { privateKey: secretKey ? TypedArrayEncoder.fromString(secretKey) : undefined },
  })

  const did = didCreateResult.didState.did as string
  const didKey = DidKey.fromDid(did)
  const kid = `${did}#${didKey.key.fingerprint}`

  const verificationMethod = didCreateResult.didState.didDocument?.dereferenceKey(kid, ['authentication'])
  if (!verificationMethod) throw new Error('No verification method found')

  return {
    did,
    kid,
    verificationMethod,
  }
}
