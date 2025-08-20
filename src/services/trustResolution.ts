import { IOrg, resolve } from '@verana-labs/verre'

import { MobileAgent } from './agent'

import { ServiceInfo } from '@2060/model'
import { log } from '@2060/utils'

export async function getServiceInfo(options: {
  agent: MobileAgent
  did: string
}): Promise<ServiceInfo | null> {
  const { agent, did } = options

  const trustResolution = await resolve(did, {
    agentContext: agent.context,
  })

  if (!trustResolution.service || !trustResolution.didDocument) {
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
