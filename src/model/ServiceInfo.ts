export type ServiceStatus = 'trusted' | 'notTrusted' | 'notFound'

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
