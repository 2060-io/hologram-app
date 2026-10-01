import { ServiceInfo, ServiceStatus } from '@src/model'
import { logWarn } from '@src/utils'
import { type ResolveResponse, resolveTrust } from './verana/indexer'

const NO_DID_DOCUMENT_METHODS = ['key', 'jwk', 'peer']

const STATUS_BY_RESOLUTION = {
  trusted: ServiceStatus.Trusted,
  untrusted: ServiceStatus.Untrusted,
  unverified: ServiceStatus.Unverified,
} as const

const stringOf = (value: unknown) => (typeof value === 'string' ? value : undefined)

const subjectOf = (response: ResolveResponse | undefined, ecsSchemas: string[]) =>
  response?.ecsCredentials?.find((credential) => ecsSchemas.includes(credential.ecsSchema))?.credentialSubject

export async function getServiceInfo({ did }: { did: string }): Promise<ServiceInfo> {
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

  const resolution = await resolveTrust(did)
  for (const verdict of resolution.verdicts) {
    if (verdict.kind === 'failed')
      logWarn(`Verana resolve of ${did} failed on ${verdict.network.id}: ${String(verdict.error)}`)
  }

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
      verdict && status !== ServiceStatus.Unverified
        ? { id: verdict.network.id, label: verdict.network.label, production: verdict.network.production }
        : undefined,
    evaluatedAtTime: answer?.evaluatedAtTime,
    expiresAtTime: answer?.expiresAtTime ?? undefined,
    ecsCredentials: trustedAnswer?.ecsCredentials,
    presentations: answer?.presentations,
  }
}
