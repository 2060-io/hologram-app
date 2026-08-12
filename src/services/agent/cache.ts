import { AgentContext, CacheModuleConfig } from '@credo-ts/core'
import { DidCommConnectionsApi } from '@credo-ts/didcomm'
import { isServiceInfo, ServiceInfo, UNVERIFIED_SERVICE_STATUS } from '@src/model'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@src/utils/connectionUtils'

export async function getInCacheServiceInfo(did: string, agentContext: AgentContext): Promise<ServiceInfo | null> {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  const cachedServiceInfo = await cache.get<ServiceInfo>(agentContext, `serviceInfo:${did}`)
  if (cachedServiceInfo && isServiceInfo(cachedServiceInfo)) return cachedServiceInfo
  // If info is not in cache, attempt to find it from an existing connection
  const [connection] = await agentContext.dependencyManager.resolve(DidCommConnectionsApi).findByInvitationDid(did)
  if (connection) {
    return {
      did,
      id: did,
      minimumAgeRequired: 0,
      name: getConnectionDisplayName(connection),
      logoUrl: getConnectionDisplayPicture(connection),
      status: UNVERIFIED_SERVICE_STATUS,
      claimsVerified: false,
    }
  }
  return null
}

export async function saveInCacheServiceInfo(did: string, agentContext: AgentContext, serviceInfo: ServiceInfo) {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  await cache.set<ServiceInfo>(agentContext, `serviceInfo:${did}`, {
    ...serviceInfo,
    lastTimeUpdated: new Date().getTime(),
  })
}
