import { AgentContext, CacheModuleConfig } from '@credo-ts/core'
import { DidCommConnectionsApi } from '@credo-ts/didcomm'
import { isServiceInfo, ServiceInfo, ServiceStatus } from '@src/model'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'

const cacheKey = (did: string) => `serviceInfo:${did}`

const isExpired = (serviceInfo: ServiceInfo) =>
  !serviceInfo.expiresAtTime || Date.parse(serviceInfo.expiresAtTime) <= Date.now()

export async function getInCacheServiceInfo(did: string, agentContext: AgentContext): Promise<ServiceInfo | null> {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  const cachedServiceInfo = await cache.get<ServiceInfo>(agentContext, cacheKey(did))
  if (cachedServiceInfo && isServiceInfo(cachedServiceInfo) && !isExpired(cachedServiceInfo)) return cachedServiceInfo
  // If info is not in cache, attempt to find it from an existing connection
  const [connection] = await agentContext.dependencyManager.resolve(DidCommConnectionsApi).findByInvitationDid(did)
  if (connection) {
    return {
      did,
      id: did,
      minimumAgeRequired: 0,
      name: getConnectionDisplayName(connection),
      logoUrl: getConnectionDisplayPicture(connection),
      status: ServiceStatus.Resolving,
    }
  }
  return null
}

export async function saveInCacheServiceInfo(did: string, agentContext: AgentContext, serviceInfo: ServiceInfo) {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  await cache.set<ServiceInfo>(agentContext, cacheKey(did), serviceInfo)
}

export async function removeInCacheServiceInfo(did: string, agentContext: AgentContext) {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  await cache.remove(agentContext, cacheKey(did))
}
