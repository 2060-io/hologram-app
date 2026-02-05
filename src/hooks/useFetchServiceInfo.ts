import { CacheModuleConfig } from '@credo-ts/core'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getServiceInfo as getServiceInfoApi } from '../services/trustResolution'

import { useMobileAgent } from './agent/MobileAgentProvider'

import { useNetwork } from '@2060/hooks/useNetwork'
import { isServiceInfo, ServiceInfo } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { logError } from '@2060/utils'
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
        const serviceInfoResponse = await getServiceInfoApi({
          agent,
          did,
        })

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
  const [connection] = await agent.didcomm.connections.findByInvitationDid(did)

  if (connection) {
    return {
      did,
      id: did,
      minimumAgeRequired: 0,
      name: getConnectionDisplayName(connection),
      logoUrl: getConnectionDisplayPicture(connection),
      status: TrustResolutionOutcome.INVALID,
    }
  }

  return undefined
}

async function storeServiceInfo(did: string, agent: MobileAgent, serviceInfo: ServiceInfo) {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache

  await cache.set<ServiceInfo>(agent.context, `serviceInfo:${did}`, serviceInfo)
}
