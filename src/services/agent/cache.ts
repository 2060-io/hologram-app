import { CacheModuleConfig } from '@credo-ts/core'
import { TrustResolutionOutcome } from '@verana-labs/verre'

import { MobileAgent } from './MobileAgent'

import { isServiceInfo, ServiceInfo } from '@src/model'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'

export async function getInCacheServiceInfo(did: string, agent: MobileAgent): Promise<ServiceInfo | null> {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
  const cachedServiceInfo = await cache.get<ServiceInfo>(agent.context, `serviceInfo:${did}`)
  if (cachedServiceInfo && isServiceInfo(cachedServiceInfo)) return cachedServiceInfo
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
  return null
}

export async function saveInCacheServiceInfo(did: string, agent: MobileAgent, serviceInfo: ServiceInfo) {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
  await cache.set<ServiceInfo>(agent.context, `serviceInfo:${did}`, {
    ...serviceInfo,
    lastTimeUpdated: new Date().getTime(),
  })
}
