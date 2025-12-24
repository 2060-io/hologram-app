import { AgentDependencies, Logger, LogLevel } from '@credo-ts/core'
import {
  DidCommEventTypes,
  DidCommMediatorPickupStrategy,
  DidCommMessageProcessedEvent,
  DidCommMessageReceivedEvent,
  DidCommMessageSentEvent,
} from '@credo-ts/didcomm'
import { agentDependencies } from '@credo-ts/react-native'
import Config from 'react-native-config'

import { HologramCustomLogger } from './HologramCustomLoggers'
import { MobileAgent } from './agent/MobileAgent'
import { createMobileAgent } from './agent/createMobileAgent'
import { duplicatedMessagesMiddleware } from './agent/duplicatedMessagesMiddleware'
import { DEV_ENVS_PERSIST_KEY, DEVELOPER_MODE_ENABLED_PERSIST_KEY, getStorageData } from './localStorage'

import { DevEnvsObject } from '@2060/utils/developer'

interface MobileAgentConfig {
  agentDependencies: AgentDependencies
  mediatorPickupStrategy: DidCommMediatorPickupStrategy
}

const baseAgentConfig: MobileAgentConfig = {
  agentDependencies,
  mediatorPickupStrategy: DidCommMediatorPickupStrategy.None,
}

const getIndyVDRProxyBaseUrl = async () => {
  const persistedDevEnvs = await getStorageData(DEV_ENVS_PERSIST_KEY)
  if (persistedDevEnvs) {
    return (persistedDevEnvs as DevEnvsObject).INDY_VDR_PROXY_BASE_URL
  }
  return Config.INDY_VDR_PROXY_BASE_URL
}

const getIsDeveloperMode = async () => {
  const persistedDeveloperMode = await getStorageData(DEVELOPER_MODE_ENABLED_PERSIST_KEY)
  return (persistedDeveloperMode as boolean) ?? false
}

let logger: Logger
export const setupMobileAgent = async (): Promise<MobileAgent> => {
  const indyVDRProxyBaseUrl = await getIndyVDRProxyBaseUrl()
  const isDeveloperMode = await getIsDeveloperMode()
  if (__DEV__) {
    logger = new HologramCustomLogger(LogLevel.debug)
  } else {
    logger = new HologramCustomLogger(isDeveloperMode ? LogLevel.debug : LogLevel.warn)
  }
  const agent = createMobileAgent({
    config: {
      logger,
      autoUpdateStorageOnStartup: true,
    },
    indyVDRProxyBaseUrl,
    modulesConfig: {
      mediatorPickupStrategy: baseAgentConfig.mediatorPickupStrategy,
    },
    dependencies: baseAgentConfig.agentDependencies,
  })

  agent.events.on<DidCommMessageReceivedEvent>(DidCommEventTypes.DidCommMessageReceived, async data => {
    logger.info('Message received', data.payload.message ?? undefined)
  })

  agent.events.on<DidCommMessageProcessedEvent>(DidCommEventTypes.DidCommMessageProcessed, async data => {
    logger.info(`Message received with type: ${data.payload.message.type}`)
  })

  agent.events.on<DidCommMessageSentEvent>(DidCommEventTypes.DidCommMessageSent, async data => {
    logger.info(`Message sent (${data.payload.status})`, data.payload.message.message)
  })

  agent.didcomm.registerMessageHandlerMiddleware(duplicatedMessagesMiddleware)

  return agent
}
