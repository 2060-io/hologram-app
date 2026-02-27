import { fetch as NetInfo } from '@react-native-community/netinfo'
import { useEffect, useState, useTransition } from 'react'
import { useTranslation } from 'react-i18next'

import { getServiceInfo as getServiceInfoApi } from '../services/trustResolution'

import { useMobileAgent } from './agent/MobileAgentProvider'
import { updateThreadFromServiceInfo } from './agent/chat/services'
import { useLocalRealm } from './providers/RealmProvider'

import { ServiceInfo } from '@src/model'
import { getInCacheServiceInfo, saveInCacheServiceInfo } from '@src/services/agent/cache'
import { logError } from '@src/utils'
import { isOlderThan24Hours } from '@src/utils/dateUtils'
import { toast } from '@src/utils/toast'

/**
 * Retrieve and cache Verifiable Service information from the Trust Registry.
 *
 * Behavior:
 * - On mount if `forceFetchIfNotInCache` is true and the cached value is missing or older than 24 hours,
 *   it will trigger a background fetch from the Trust Registry.
 * - When fresh info is obtained, stored cache info is updated and chat thread for the
 *   corresponding connection is updated with the latest name and logo.
 *
 * @param did decentralized identifier of the service.
 * @param forceFetchIfNotInCache whether to attempt a refresh on mount
 * when the cached value is stale or missing.
 *
 * @returns Object with the latest known ServiceInfo or undefined, loading and error state flags,
 * and `getServiceInfo` function to trigger a manual refresh.
 */
export const useFetchServiceInfo = (did?: string, forceFetchIfNotInCache: boolean = true) => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | undefined>()
  const [isFetchingInfo, startFetchServiceInfoTransition] = useTransition()
  const [failedFetchInfo, setFailed] = useState<boolean>(false)

  useEffect(() => {
    const verifyHasToFetchInfo = async () => {
      if (!did || !agent) return
      const cachedServiceInfo = await getInCacheServiceInfo(did, agent)
      if (cachedServiceInfo) setServiceInfo(cachedServiceInfo)
      const firstConditionToFetch = forceFetchIfNotInCache
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
          await saveInCacheServiceInfo(did, agent, serviceInfoResponse)
          if (realm) updateThreadFromServiceInfo({ did, serviceInfoResponse, realm, agent })
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
