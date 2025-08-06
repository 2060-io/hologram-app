import { AgentContext, DidResolverService } from '@credo-ts/core'
import { IOrg, resolve } from '@verana-labs/verre'
import { Resolver } from 'did-resolver'

import { MobileAgent } from './agent'

import { ServiceInfo } from '@2060/model'
import { log } from '@2060/utils'

export async function getServiceInfo(options: {
  agent: MobileAgent
  did: string
}): Promise<ServiceInfo | null> {
  const { agent, did } = options
  const didResolverService = agent.dependencyManager.resolve(DidResolverService)
  const agentContext = agent.dependencyManager.resolve(AgentContext)

  // Create a custom resolver using Credo-TS resolution strategies
  const didResolver = new Resolver({
    web: async (_did: string) => didResolverService.resolve(agentContext, _did),
    key: async (_did: string) => didResolverService.resolve(agentContext, _did),
    peer: async (_did: string) => didResolverService.resolve(agentContext, _did),
    jwk: async (_did: string) => didResolverService.resolve(agentContext, _did),
  })

  const trustResolution = await resolve(did, {
    agentContext: agent.context,
    didResolver,
  })
  log(`trustResolution: ${JSON.stringify(trustResolution)}`)
  if (!trustResolution.service || !trustResolution.didDocument) {
    return null
  }

  const serviceInfo: ServiceInfo = {
    did: trustResolution.didDocument.id,
    id: trustResolution.didDocument.id,
    minimumAgeRequired: trustResolution.service.minimumAgeRequired!,
    name: trustResolution.service.name,
    status: 'trusted',
    dataPrivacyUrl: trustResolution.service.privacyPolicy,
    description: trustResolution.service?.description,
    logoUrl: trustResolution.service?.logo,
    termsAndConditionsUrl: trustResolution.service?.termsAndConditions,
    serviceProvider: {
      certificationEntity: {
        countryCode: (trustResolution.serviceProvider! as IOrg).countryCode,
        entityName: (trustResolution.serviceProvider! as IOrg).name,
        officialPublicRegistryNumber: (trustResolution.serviceProvider! as IOrg).registryId,
        status: 'trusted',
        trustRegistry: {
          name: (trustResolution.serviceProvider! as IOrg).name,
          status: 'trusted',
        },
      },
      status: 'trusted',
      countryCode: (trustResolution.serviceProvider! as IOrg).countryCode,
      entityName: (trustResolution.serviceProvider! as IOrg).name,
      officialPublicRegistryNumber: (trustResolution.serviceProvider! as IOrg).registryId,
    },
  }
  return serviceInfo
}
