import type { EcsCredential, TrustPresentation } from '@src/services/verana/indexer'

export enum ServiceStatus {
  Resolving = 'resolving',
  Trusted = 'trusted',
  Untrusted = 'untrusted',
  Unverified = 'unverified',
}

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
}

export type ServiceInfo = {
  did: string
  description?: string
  id: string
  logoUrl?: string
  dataPrivacyUrl?: string
  minimumAgeRequired: number
  termsAndConditionsUrl?: string
  name: string
  serviceProvider?: ServiceProvider
  status: ServiceStatus
  untrustedReason?: 'noDidDocument'
  network?: { id: string; label: string; production: boolean }
  evaluatedAtTime?: string
  expiresAtTime?: string
  ecsCredentials?: EcsCredential[]
  presentations?: TrustPresentation[]
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
