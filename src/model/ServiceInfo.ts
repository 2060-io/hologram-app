import { VeranaTrustStatus } from '@src/services/verana'
import { TrustResolutionOutcome } from '@verana-labs/verre'

/**
 * Wallet-local: nothing is known yet, or the resolver could not be reached. verre has no such
 * outcome, and painting that state as `invalid` accuses the counterparty before anything is known.
 */
export const UNVERIFIED_SERVICE_STATUS = 'unverified'

export type ServiceStatus = TrustResolutionOutcome | typeof UNVERIFIED_SERVICE_STATUS

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
  trustStatus: VeranaTrustStatus
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
