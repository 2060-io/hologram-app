import { AgentContext, AgentMessage, CacheModuleConfig, InboundMessageContext } from '@credo-ts/core'

import { logWarn } from '@2060/utils'
import { getAreLogsEnabled } from '@2060/utils/developer'

export const duplicatedMessagesMiddleware = async (
  inboundMessageContext: InboundMessageContext,
  next: () => Promise<void>,
) => {
  const { agentContext, message } = inboundMessageContext

  if (await isInCache(agentContext, message.id)) {
    const displayToast = await getAreLogsEnabled()
    logWarn(`Received duplicated message with id '${message.id}'`, displayToast)
    return
  }
  await saveInCache(agentContext, message)

  await next()
}

async function isInCache(agentContext: AgentContext, messageId: string) {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  const cacheKey = `didcomm:receivedmessages:${messageId}`
  const cachedMessage = await cache.get(agentContext, cacheKey)

  return cachedMessage !== null
}

async function saveInCache(agentContext: AgentContext, message: AgentMessage) {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  const cacheKey = `didcomm:receivedmessages:${message.id}`
  await cache.set(agentContext, cacheKey, {}, 300)
}
