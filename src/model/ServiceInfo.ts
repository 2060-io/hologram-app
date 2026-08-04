import { isVeranaTestnet, VeranaTrustStatus } from '@src/services/verana'
import { TrustResolutionOutcome } from '@verana-labs/verre'

/**
 * Wallet-local: nothing is known yet, or the resolver could not be reached. verre has no such
 * outcome, and painting that state as `invalid` accuses the counterparty before anything is known.
 */
export const UNVERIFIED_SERVICE_STATUS = 'unverified'

export type ServiceStatus = TrustResolutionOutcome | typeof UNVERIFIED_SERVICE_STATUS

/**
 * On a testnet build `verified-test` IS the success outcome, so warning about it would contradict
 * the trust card rendered on the same screen. On a production build it stays a warning, because a
 * test credential really is not production trust.
 */
export const isTrustedStatus = (status: ServiceStatus): boolean =>
  status === TrustResolutionOutcome.VERIFIED ||
  (status === TrustResolutionOutcome.VERIFIED_TEST && isVeranaTestnet)

export type BaseEntity = {
  countryCode: string
  entityName: string
  officialPublicRegistryNumber: string
  status: ServiceStatus
}

interface CertificationEntity extends BaseEntity {
  trustRegistry: {
    name: string
    status: ServiceStatus
  }
}

export interface ServiceProvider extends BaseEntity {
  certificationEntity: CertificationEntity
  address?: string
}

export type ServiceInfo = {
  did: string
  description?: string
  id: string
  logoUrl?: string
  dataPrivacyUrl?: string
  dataPrivacyDigestSri?: string
  minimumAgeRequired: number
  termsAndConditionsUrl?: string
  termsAndConditionsDigestSri?: string
  name: string
  serviceProvider?: ServiceProvider
  status: ServiceStatus
  /**
   * Absent until the resolver answers. A placeholder assembled from a connection carries a name
   * but no verdict, and must not read as one.
   */
  trustStatus?: VeranaTrustStatus
  /**
   * The resolver anchored these ECS credentials in a registry the wallet trusts. verre returns a
   * structurally valid credential either way, so without this a service that issues its own ECS
   * credentials to itself would earn a green tick the registry never gave it.
   */
  claimsVerified: boolean
  claimsSelfIssued?: boolean
  lastTimeUpdated?: number
}

export type IssuerInfo = {
  id: string
  name: string
  logoUrl?: string
  description?: string
  status: ServiceStatus
}

export type VerifierInfo = {
  id: string
  name: string
  logoUrl?: string
  description?: string
  status: string
}

export function isServiceInfo(object: Record<string, unknown>): object is ServiceInfo {
  return (
    object &&
    typeof object.did === 'string' &&
    typeof object.id === 'string' &&
    typeof object.status === 'string' &&
    typeof object.minimumAgeRequired === 'number'
  )
}
