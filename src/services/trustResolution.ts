import { ServiceInfo } from '@src/model'
import { log, logError } from '@src/utils'
import { ECS, IOrg, IService, resolveDID, TrustResolutionOutcome } from '@verana-labs/verre'
import { Resolver } from 'did-resolver'
import { MobileAgent } from './agent'
import { areClaimsRegistryVerified, deriveVeranaTrustStatus, veranaRegistries } from './verana'

function getCredoTsDidResolver(agent: MobileAgent): Resolver {
  return new Resolver(
    new Proxy(
      {},
      {
        get: (_target, _method: string) => {
          return async (did: string) => agent.dids.resolve(did)
        },
      }
    )
  )
}

function toServiceProvider(organization: IOrg, status: ServiceInfo['status']): ServiceInfo['serviceProvider'] {
  return {
    address: organization.address,
    countryCode: organization.countryCode,
    entityName: organization.name,
    officialPublicRegistryNumber: organization.registryId,
    status,
    certificationEntity: {
      countryCode: organization.countryCode,
      entityName: organization.name,
      officialPublicRegistryNumber: organization.registryId,
      status,
      trustRegistry: { name: organization.name, status },
    },
  }
}

/**
 * Returns null only when the resolver could not answer at all, which the caller renders as
 * UNVERIFIED. A DID that resolves without ECS credentials is a verdict, not a failure, and must
 * survive as a ServiceInfo so the consent screens can say UNTRUSTED rather than "could not check".
 */
export async function getServiceInfo(options: { agent: MobileAgent; did: string }): Promise<ServiceInfo | null> {
  const { agent, did } = options

  const trustResolution = await resolveDID(did, {
    skipDigestSRICheck: true,
    logger: agent.config.logger,
    didResolver: getCredoTsDidResolver(agent),
    verifiablePublicRegistries: veranaRegistries,
  })

  if (!trustResolution.didDocument) {
    logError(`trustResolution: ${JSON.stringify(trustResolution)}`)
    return null
  }
  log(`trustResolution: ${JSON.stringify(trustResolution)}`)

  const service: IService | undefined = trustResolution.service
  const organization =
    trustResolution.serviceProvider?.schemaType === ECS.ORG ? (trustResolution.serviceProvider as IOrg) : undefined

  const status = trustResolution.outcome
  const claimsVerified = areClaimsRegistryVerified(status)
  const trustStatus = deriveVeranaTrustStatus({
    resolved: true,
    hasServiceCredential: claimsVerified && service !== undefined,
    hasOrganizationCredential: claimsVerified && organization !== undefined,
    structurallyValid: status !== TrustResolutionOutcome.INVALID,
  })

  return {
    did: trustResolution.didDocument.id,
    id: trustResolution.didDocument.id,
    minimumAgeRequired: service?.minimumAgeRequired ?? 0,
    name: service?.name ?? '',
    status,
    trustStatus,
    claimsVerified,
    claimsSelfIssued: service !== undefined && service.issuer === trustResolution.didDocument.id,
    dataPrivacyUrl: service?.privacyPolicy,
    dataPrivacyDigestSri: service?.privacyPolicyDigestSri,
    description: service?.description,
    logoUrl: service?.logo,
    termsAndConditionsUrl: service?.termsAndConditions,
    termsAndConditionsDigestSri: service?.termsAndConditionsDigestSri,
    serviceProvider: organization ? toServiceProvider(organization, status) : undefined,
  }
}
