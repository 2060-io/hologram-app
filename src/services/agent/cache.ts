import { CacheModuleConfig } from '@credo-ts/core'

import { MobileAgent } from './MobileAgent'

import { isServiceInfo, ServiceInfo } from '@src/model'

export async function getInCacheServiceInfo(did: string, agent: MobileAgent): Promise<ServiceInfo | null> {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
  const cachedServiceInfo = await cache.get<ServiceInfo>(agent.context, `serviceInfo:${did}`)
  if (cachedServiceInfo && isServiceInfo(cachedServiceInfo)) return cachedServiceInfo
  return null
}

export async function saveInCacheServiceInfo(did: string, agent: MobileAgent, serviceInfo: ServiceInfo) {
  const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
  await cache.set<ServiceInfo>(agent.context, `serviceInfo:${did}`, {
    ...serviceInfo,
    lastTimeUpdated: new Date().getTime(),
  })
}
