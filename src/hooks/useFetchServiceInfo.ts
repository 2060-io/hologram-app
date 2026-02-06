import { CacheModuleConfig } from '@credo-ts/core'
import { fetch as NetInfo } from '@react-native-community/netinfo'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Realm from 'realm'

import { getServiceInfo as getServiceInfoApi } from '../services/trustResolution'

import { useMobileAgent } from './agent/MobileAgentProvider'
import { findChatThread, updateThread } from './agent/chat/services'
import { useLocalRealm } from './providers/RealmProvider'

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
 * @param did decentralized identifier of the service
 * @param forceFetch attempt to refresh service info, even if it is already cached
 *
 * @returns ServiceInfo object if found, undefined otherwise
 */
export const useFetchServiceInfo = (did?: string, forceFetch: boolean = true) => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | undefined>()
  const [isFetchingInfo, setIsFetching] = useState(false)
  const [failedFetchInfo, setFailed] = useState<boolean>(false)

  useEffect(() => {
    const getServiceInfo = async () => {
      if (!did || !agent) return

      const cachedServiceInfo = await getStoredServiceInfo(did, agent)
      if (cachedServiceInfo) setServiceInfo(cachedServiceInfo)

      const firstConditionToFetch = forceFetch
      const secondConditionToFetch =
        !cachedServiceInfo?.lastTimeUpdated || isOlderThan24Hours(cachedServiceInfo.lastTimeUpdated)
      const mustTriggerFetch = firstConditionToFetch && secondConditionToFetch
      if (!mustTriggerFetch) return

      const isNetworkConnected = Boolean((await NetInfo()).isConnected)
      if (!isNetworkConnected) {
        setFailed(true)
        toast({ type: 'error', message: t('invitation.unableToGetServiceInfo') })
        return
      }

      try {
        setIsFetching(true)
        const serviceInfoResponse = await getServiceInfoApi({ agent, did })
        // if service exists in trust registry, store it in cache otherwise keep the cached one (if any)
        if (serviceInfoResponse) {
          setServiceInfo(serviceInfoResponse)
          await storeServiceInfo(did, agent, serviceInfoResponse)
          if (realm) updateChatThread({ did, serviceInfoResponse, realm, agent })
        } else if (cachedServiceInfo) {
          await storeServiceInfo(did, agent, cachedServiceInfo)
        }
      } catch (error) {
        logError(`Error getting service ${did} info API`, error)
        toast({ type: 'error', message: t('invitation.errorGettingServiceInfoAPI') })
      } finally {
        setIsFetching(false)
      }
    }
    getServiceInfo()
  }, [realm, did])

  return {
    serviceInfo,
    isFetchingInfo,
    failedFetchInfo,
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
  await cache.set<ServiceInfo>(agent.context, `serviceInfo:${did}`, {
    ...serviceInfo,
    lastTimeUpdated: new Date().getTime(),
  })
}

async function updateChatThread({
  did,
  serviceInfoResponse,
  realm,
  agent,
}: {
  did: string
  serviceInfoResponse: ServiceInfo
  realm: Realm
  agent: MobileAgent
}) {
  const [connection] = await agent.connections.findByInvitationDid(did)
  if (!connection) return
  const thread = findChatThread(realm, connection)
  if (!thread) return
  updateThread(realm, thread.id, {
    topic: serviceInfoResponse.name,
    picture: serviceInfoResponse.logoUrl,
  })
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000 // 86400000 ms
function isOlderThan24Hours(lastTimeUpdated: number): boolean {
  return new Date().getTime() - lastTimeUpdated >= TWENTY_FOUR_HOURS_MS
}
