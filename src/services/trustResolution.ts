import { ServiceInfo, ServiceStatus } from '@src/model'
import { log, logWarn } from '@src/utils'
import type { MobileAgent } from './agent/MobileAgent'
import { type ResolveResponse, resolveTrust, type TrustResolution } from './verana/indexer'

const NO_DID_DOCUMENT_METHODS = ['key', 'jwk', 'peer']

const STATUS_BY_RESOLUTION = {
  trusted: ServiceStatus.Trusted,
  untrusted: ServiceStatus.Untrusted,
  unverified: ServiceStatus.Unverified,
} as const

const stringOf = (value: unknown) => (typeof value === 'string' ? value : undefined)

const subjectOf = (response: ResolveResponse | undefined, ecsSchemas: string[]) =>
  response?.ecsCredentials?.find((credential) => ecsSchemas.includes(credential.ecsSchema))?.credentialSubject

const resolveTrustOf = async (did: string) => {
  const resolution = await resolveTrust(did)
  for (const verdict of resolution.verdicts) {
    if (verdict.kind === 'failed')
      logWarn(`Verana resolve of ${did} failed on ${verdict.network.id}: ${String(verdict.error)}`)
  }
  return resolution
}

const alsoKnownAsOf = async (agent: MobileAgent, did: string) => {
  try {
    const { didDocument, didResolutionMetadata } = await agent.dids.resolve(did)
    if (!didDocument) {
      logWarn(
        `DID document of ${did} not resolved: ${didResolutionMetadata.error} ${didResolutionMetadata.message ?? ''}`
      )
      return []
    }
    return didDocument.alsoKnownAs ?? []
  } catch (error) {
    logWarn(`DID document of ${did} not resolved: ${String(error)}`)
    return []
  }
}

/**
 * Return the DIDs that the document of `did` lists in `alsoKnownAs`, and whose own document lists `did` back.
 * Without the mutual link, any DID document could claim to be an alias of a trusted service.
 */
const resolveAlternativeDids = async (agent: MobileAgent, did: string) => {
  const candidates = (await alsoKnownAsOf(agent, did)).filter((alias) => alias !== did && alias.startsWith('did:'))
  const accepted: string[] = []
  for (const alias of candidates) {
    if ((await alsoKnownAsOf(agent, alias)).includes(did)) accepted.push(alias)
    else logWarn(`${alias} does not list ${did} in alsoKnownAs, alias ignored`)
  }
  return accepted
}

/**
 * Resolve the trust of `did`. When `did` is not trusted, resolve the trust of each accepted alternative DID.
 * A trusted alternative DID wins. Otherwise an unverified result wins over an untrusted result.
 */
const resolveTrustWithAlternatives = async (agent: MobileAgent, did: string): Promise<TrustResolution> => {
  const resolution = await resolveTrustOf(did)
  if (resolution.status === 'trusted') return resolution

  let fallback = resolution
  for (const alias of await resolveAlternativeDids(agent, did)) {
    const aliasResolution = await resolveTrustOf(alias)
    if (aliasResolution.status === 'trusted') {
      log(`Service ${did} is trusted through its alternative DID ${alias}`)
      return aliasResolution
    }
    if (fallback.status === 'untrusted' && aliasResolution.status === 'unverified') fallback = aliasResolution
  }
  return fallback
}

export async function getServiceInfo({ did, agent }: { did: string; agent: MobileAgent }): Promise<ServiceInfo> {
  if (NO_DID_DOCUMENT_METHODS.includes(did.split(':')[1])) {
    return {
      did,
      id: did,
      name: '',
      minimumAgeRequired: 0,
      status: ServiceStatus.Untrusted,
      untrustedReason: 'noDidDocument',
    }
  }

  const resolution = await resolveTrustWithAlternatives(agent, did)
  const status = STATUS_BY_RESOLUTION[resolution.status]
  const verdict = resolution.verdict
  const answer =
    verdict && verdict.kind !== 'failed' && status !== ServiceStatus.Unverified ? verdict.response : undefined
  const trustedAnswer = status === ServiceStatus.Trusted ? answer : undefined
  const service = subjectOf(trustedAnswer, ['ServiceCredential'])
  const operator = subjectOf(trustedAnswer, ['OrganizationCredential', 'PersonaCredential'])
  const operatorEntity = operator && {
    countryCode: stringOf(operator.countryCode) ?? '',
    entityName: stringOf(operator.name) ?? '',
    officialPublicRegistryNumber: stringOf(operator.registryId) ?? '',
    status,
  }

  return {
    did,
    id: did,
    status,
    name: stringOf(service?.name) ?? '',
    description: stringOf(service?.description),
    logoUrl: stringOf(service?.logoUri),
    dataPrivacyUrl: stringOf(service?.privacyPolicyUri),
    termsAndConditionsUrl: stringOf(service?.termsAndConditionsUri),
    minimumAgeRequired: typeof service?.minimumAgeRequired === 'number' ? service.minimumAgeRequired : 0,
    serviceProvider: operatorEntity,
    network:
      verdict && status === ServiceStatus.Trusted
        ? { id: verdict.network.id, label: verdict.network.label, production: verdict.network.production }
        : undefined,
    evaluatedAtTime: answer?.evaluatedAtTime,
    expiresAtTime: answer?.expiresAtTime ?? undefined,
    ecsCredentials: trustedAnswer?.ecsCredentials,
    presentations: answer?.presentations,
  }
}
