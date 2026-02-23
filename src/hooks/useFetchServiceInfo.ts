import { CacheModuleConfig } from '@credo-ts/core'
import { fetch as NetInfo } from '@react-native-community/netinfo'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import { useEffect, useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'
import Realm from 'realm'

import { getServiceInfo as getServiceInfoApi } from '../services/trustResolution'

import { useMobileAgent } from './agent/MobileAgentProvider'
import { findChatThread, updateThread } from './agent/chat/services'
import { useLocalRealm } from './providers/RealmProvider'

import { isServiceInfo, ServiceInfo } from '@src/model'
import { MobileAgent } from '@src/services/agent'
import { logError } from '@src/utils'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'
import { toast } from '@src/utils/toast'

/**
 * Retrieve and cache Verifiable Service information from the Trust Registry.
 *
 * Behavior:
 * - On mount if `forceFetch` is true and the cached value is missing or older than 24 hours,
 *   it will trigger a background fetch from the Trust Registry.
 * - When fresh info is obtained, stored cache info is updated and chat thread for the
 *   corresponding connection is updated with the latest name and logo.
 *
 * @param did decentralized identifier of the service.
 * @param forceFetch whether to attempt a refresh on mount when the cached value is stale or missing.
 *
 * @returns Object with the latest known ServiceInfo or undefined, loading and error state flags,
 * and `getServiceInfo` function to trigger a manual refresh.
 */
export const useFetchServiceInfo = (did?: string, forceFetch: boolean = true) => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | undefined>()
  const [isFetchingInfo, startFetchServiceInfoTransition] = useTransition()
  const [failedFetchInfo, setFailed] = useState<boolean>(false)

  useEffect(() => {
    const verifyHasToFetchInfo = async () => {
      if (!did || !agent) return
      const cachedServiceInfo = await getStoredServiceInfo(did, agent)
      if (cachedServiceInfo) setServiceInfo(cachedServiceInfo)
      const firstConditionToFetch = forceFetch
      const secondConditionToFetch =
        !cachedServiceInfo?.lastTimeUpdated || isOlderThan24Hours(cachedServiceInfo.lastTimeUpdated)
      const mustTriggerFetch = firstConditionToFetch && secondConditionToFetch
      if (mustTriggerFetch) getServiceInfo()
    }
    verifyHasToFetchInfo()
  }, [realm, did])

  const getServiceInfo = async () => {
    if (!did || !agent) return
    setFailed(false)

    const isNetworkConnected = Boolean((await NetInfo()).isConnected)
    if (!isNetworkConnected) {
      setFailed(true)
      toast({ type: 'error', message: t('invitation.unableToGetServiceInfo') })
      return
    }
    startFetchServiceInfoTransition(async () => {
      try {
        const serviceInfoResponse = await getServiceInfoApi({ agent, did })
        // if service exists in trust registry, store it in cache otherwise keep the cached one (if any)
        if (serviceInfoResponse) {
          setServiceInfo(serviceInfoResponse)
          await setStoreServiceInfo(did, agent, serviceInfoResponse)
          if (realm) updateChatThread({ did, serviceInfoResponse, realm, agent })
        }
      } catch (error) {
        logError(`Error getting service ${did} info API`, error)
        toast({ type: 'error', message: t('invitation.errorGettingServiceInfoAPI') })
      }
    })
  }

  return {
    serviceInfo,
    isFetchingInfo,
    failedFetchInfo,
    getServiceInfo,
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

async function setStoreServiceInfo(did: string, agent: MobileAgent, serviceInfo: ServiceInfo) {
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
  const [connection] = await agent.didcomm.connections.findByInvitationDid(did)
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
