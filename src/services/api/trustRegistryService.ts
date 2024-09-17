import axios from 'axios'

export type ServiceStatus = 'trusted' | 'notTrusted' | 'notFound'

export type BaseEntity = {
  countryCode: string
  entityName: string
  officialPublicRegistryNumber: number
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

export async function reportMessage(options: {
  did: string
  type: string
  metadata: Record<string, unknown>
  trustedServiceResolverBaseUrl: string
}) {
  const { did, type, metadata, trustedServiceResolverBaseUrl } = options
  const response = await axios({
    method: 'POST', //
    url: `${trustedServiceResolverBaseUrl}/v1/reported-messages`,
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ did, contents: JSON.stringify({ type, metadata }) }),
  })

  return response.status === 200
}

export async function getServiceInfo(options: {
  did: string
  trustedServiceResolverBaseUrl: string
}): Promise<ServiceInfo | null> {
  const { did, trustedServiceResolverBaseUrl } = options
  const response = await axios.get(`${trustedServiceResolverBaseUrl}/v1/services/did/${did}`, {
    validateStatus: function (status) {
      return status === 200 || status === 404 // Resolve only if the status code 200 or 404
    },
    headers: { 'Content-Type': 'application/json' },
  })
  return response.status === 200 && isServiceInfo(response.data) ? response.data : null
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
