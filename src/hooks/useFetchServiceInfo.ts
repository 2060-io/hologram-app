import { AgentContext, CacheModuleConfig, DidResolverService } from '@credo-ts/core'
import { IOrg, resolve } from '@verana-labs/verre'
import { Resolver } from 'did-resolver'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useMobileAgent } from './agent/MobileAgentProvider'

import { useNetwork } from '@2060/hooks/useNetwork'
import { MobileAgent } from '@2060/services/agent'
import { ServiceInfo, isServiceInfo } from '@2060/services/api/trustRegistryService'
import { log, logError } from '@2060/utils'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'
import { toast } from '@2060/utils/toast'

/**
 * This hook will attempt to retrieve a given Verifiable Service information from Trust Registry. This
 * information will be stored in a cache for some time, and for performance reasons by default it will
 * try only to take info from there. But it is possible to force to refresh,
 * useful in cases where it is important to be up to date.
 *
 * @param did decentralised identifier of the service
 * @param forceFetch attempt to refresh service info, even if it is already cached
 *
 * @returns ServiceInfo object if found, undefined otherwise
 */
export const useFetchServiceInfo = (did?: string, forceFetch?: boolean) => {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | undefined>()
  const [isFetching, setIsFetching] = useState(true)
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()
  const { t } = useTranslation()
  const { agent } = useMobileAgent()

  useEffect(() => {
    const getServiceInfo = async () => {
      if (!did) {
        setServiceInfo(undefined)
        setIsFetching(false)
        return
      }

      const cachedServiceInfo = agent ? await getStoredServiceInfo(did, agent) : undefined
      if (cachedServiceInfo) setServiceInfo(cachedServiceInfo)

      if (cachedServiceInfo && !forceFetch) {
        setIsFetching(false)
        return
      }

      if (!isNetworkConnected) {
        toast({ type: 'error', message: t('invitation.unableToGetServiceInfo') })
        return
      }

      try {
        if (!agent) return
        const didResolverService = agent.dependencyManager.resolve(DidResolverService)
        const agentContext = agent.dependencyManager.resolve(AgentContext)

        // Create a custom resolver using Credo-TS resolution strategies
        const didResolver = new Resolver({
          web: async (did: string) => didResolverService.resolve(agentContext, did),
          key: async (did: string) => didResolverService.resolve(agentContext, did),
          peer: async (did: string) => didResolverService.resolve(agentContext, did),
          jwk: async (did: string) => didResolverService.resolve(agentContext, did),
        })

        const trustResolution = await resolve(did, {
          agentContext: agent.context,
          didResolver,
        })
        log(`trustResolution: ${JSON.stringify(trustResolution)}`)
        if (!trustResolution.verifiableService || !trustResolution.didDocument) {
          return
        }

        const serviceInfoResponse: ServiceInfo = {
          did: trustResolution.didDocument.id,
          id: trustResolution.didDocument.id,
          minimumAgeRequired: trustResolution.verifiableService.credentialSubject.minimumAgeRequired!,
          name: trustResolution.verifiableService.credentialSubject.name,
          status: 'trusted',
          dataPrivacyUrl: trustResolution.verifiableService.credentialSubject.privacyPolicy,
          description: trustResolution.verifiableService?.credentialSubject.description,
          logoUrl: trustResolution.verifiableService?.credentialSubject.logo,
          termsAndConditionsUrl: trustResolution.verifiableService?.credentialSubject.termsAndConditions,
          serviceProvider: {
            certificationEntity: {
              countryCode: (trustResolution.issuerCredential! as IOrg).credentialSubject.countryCode,
              entityName: (trustResolution.issuerCredential! as IOrg).credentialSubject.name,
              officialPublicRegistryNumber: (trustResolution.issuerCredential! as IOrg).credentialSubject
                .registryId,
              status: 'trusted',
              trustRegistry: {
                name: (trustResolution.issuerCredential! as IOrg).credentialSubject.name,
                status: 'trusted',
              },
            },
            status: 'trusted',
            countryCode: (trustResolution.issuerCredential! as IOrg).credentialSubject.countryCode,
            entityName: (trustResolution.issuerCredential! as IOrg).credentialSubject.name,
            officialPublicRegistryNumber: (trustResolution.issuerCredential! as IOrg).credentialSubject
              .registryId,
          },
        }
        if (serviceInfoResponse) {
          if (agent) await storeServiceInfo(did, agent, serviceInfoResponse)
          setServiceInfo(serviceInfoResponse)
        }
      } catch (error) {
        logError(`Error getting service ${did} info API: ${error}`)
        toast({ type: 'error', message: `${t('invitation.errorGettingServiceInfoAPI')} ${error}` })
      } finally {
        setIsFetching(false)
      }
    }
    getServiceInfo()
  }, [did, forceFetch])

  return {
    serviceInfo,
    isFetching,
  }
}

export async function getStoredServiceInfo(
  did: string,
  agent: MobileAgent,
): Promise<ServiceInfo | undefined> {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache

  const cachedServiceInfo = await cache.get<ServiceInfo>(agent.context, `serviceInfo:${did}`)

  if (cachedServiceInfo && isServiceInfo(cachedServiceInfo)) return cachedServiceInfo as ServiceInfo

  // If info is not in cache, attempt to find it from an existing connection
  const [connection] = await agent.connections.findByInvitationDid(did)

  if (connection) {
    return {
      did,
      id: did,
      minimumAgeRequired: 0,
      name: getConnectionDisplayName(connection),
      logoUrl: getConnectionDisplayPicture(connection),
      status: 'notFound',
    }
  }

  return undefined
}

async function storeServiceInfo(did: string, agent: MobileAgent, serviceInfo: ServiceInfo) {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache

  await cache.set<ServiceInfo>(agent.context, `serviceInfo:${did}`, serviceInfo)
}
