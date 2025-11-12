import { IOrg, resolve } from '@verana-labs/verre'

import { MobileAgent } from './agent'

import { ServiceInfo } from '@2060/model'
import { logError } from '@2060/utils'

const verifiablePublicRegistries = [
  {
    id: 'vpr:verana:vna-testnet-1',
    baseUrls: ['https://api.testnet.verana.network/verana'],
    production: false,
  },
  {
    id: 'vpr:verana:vna-mainnet-1',
    baseUrls: ['https://api.testnet.verana.network/verana'],
    production: true,
  },
]

export async function getServiceInfo(options: {
  agent: MobileAgent
  did: string
}): Promise<ServiceInfo | null> {
  const { agent, did } = options

  const trustResolution = await resolve(did, {
    agentContext: agent.context,
    verifiablePublicRegistries,
  })

  if (!trustResolution.service || !trustResolution.didDocument) {
    logError(`trustResolution: ${JSON.stringify(trustResolution)}`)
    return null
  }

  const serviceInfo: ServiceInfo = {
    did: trustResolution.didDocument.id,
    id: trustResolution.didDocument.id,
    minimumAgeRequired: trustResolution.service.minimumAgeRequired!,
    name: trustResolution.service.name,
    status: trustResolution.outcome,
    dataPrivacyUrl: trustResolution.service.privacyPolicy,
    description: trustResolution.service?.description,
    logoUrl: trustResolution.service?.logo,
    termsAndConditionsUrl: trustResolution.service?.termsAndConditions,
    serviceProvider: {
      certificationEntity: {
        countryCode: (trustResolution.serviceProvider! as IOrg).countryCode,
        entityName: (trustResolution.serviceProvider! as IOrg).name,
        officialPublicRegistryNumber: (trustResolution.serviceProvider! as IOrg).registryId,
        status: trustResolution.outcome,
        trustRegistry: {
          name: (trustResolution.serviceProvider! as IOrg).name,
          status: trustResolution.outcome,
        },
      },
      status: trustResolution.outcome,
      countryCode: (trustResolution.serviceProvider! as IOrg).countryCode,
      entityName: (trustResolution.serviceProvider! as IOrg).name,
      officialPublicRegistryNumber: (trustResolution.serviceProvider! as IOrg).registryId,
    },
  }
  return serviceInfo
}
