import { AgentContext, CacheModuleConfig } from '@credo-ts/core'
import { DidCommInboundMessageContext, DidCommMessage } from '@credo-ts/didcomm'

import { logWarn } from '@src/utils'
import { areLogsEnabled } from '@src/utils/developer'

export const duplicatedMessagesMiddleware = async (
  inboundMessageContext: DidCommInboundMessageContext,
  next: () => Promise<void>
) => {
  const { agentContext, message } = inboundMessageContext

  if (await isInCache(agentContext, message.id)) {
    const displayToast = await areLogsEnabled()
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

async function saveInCache(agentContext: AgentContext, message: DidCommMessage) {
  const cache = agentContext.dependencyManager.resolve(CacheModuleConfig).cache
  const cacheKey = `didcomm:receivedmessages:${message.id}`
  await cache.set(agentContext, cacheKey, {}, 300)
}
