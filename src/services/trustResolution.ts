import { IOrg, resolveDID } from '@verana-labs/verre'
import { Resolver } from 'did-resolver'

import { MobileAgent } from './agent'

import { ServiceInfo } from '@src/model'
import { log, logError } from '@src/utils'

function getCredoTsDidResolver(agent: MobileAgent): Resolver {
  return new Resolver(
    new Proxy(
      {},
      {
        get: (_target, _method: string) => {
          return async (did: string) => agent.dids.resolve(did)
        },
      },
    ),
  )
}

export async function getServiceInfo(options: {
  agent: MobileAgent
  did: string
}): Promise<ServiceInfo | null> {
  const { agent, did } = options

  const trustResolution = await resolveDID(did, {
    skipDigestSRICheck: true,
    logger: agent.config.logger,
    didResolver: getCredoTsDidResolver(agent),
    verifiablePublicRegistries: [
      {
        id: 'vpr:verana:vna-testnet-1',
        baseUrls: ['https://idx.testnet.verana.network/verana'],
        production: true, // FIXME: set to false once we have mainnet ready
      },
      {
        id: 'vpr:verana:vna-devnet-1',
        baseUrls: ['https://idx.devnet.verana.network/verana'],
        production: true, // FIXME: set to false once we have mainnet ready
      },
    ],
  })

  if (!trustResolution.service || !trustResolution.didDocument) {
    logError(`trustResolution: ${JSON.stringify(trustResolution)}`)
    return null
  }
  log(`trustResolution: ${JSON.stringify(trustResolution)}`)

  const serviceInfo: ServiceInfo = {
    did: trustResolution.didDocument.id,
    id: trustResolution.didDocument.id,
    minimumAgeRequired: trustResolution.service.minimumAgeRequired,
    name: trustResolution.service.name,
    status: trustResolution.outcome,
    dataPrivacyUrl: trustResolution.service.privacyPolicy,
    description: trustResolution.service.description,
    logoUrl: trustResolution.service.logo,
    termsAndConditionsUrl: trustResolution.service.termsAndConditions,
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
