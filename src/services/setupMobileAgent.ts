import {
  AgentDependencies,
  AgentEventTypes,
  AgentMessageProcessedEvent,
  AgentMessageSentEvent,
  HttpOutboundTransport,
  Logger,
  MediatorPickupStrategy,
  AgentMessageReceivedEvent,
  ConsoleLogger,
  LogLevel,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import Config from 'react-native-config'

import { MobileAgent } from './agent/MobileAgent'
import { createMobileAgent } from './agent/createMobileAgent'
import { duplicatedMessagesMiddleware } from './agent/duplicatedMessagesMiddleware'
import { DEV_ENVS_PERSIST_KEY, getStorageData } from './localStorage'
import { TunedMobileWsOutboundTransport } from './transport/TunedMobileWsOutboundTransport'

import { DevEnvsObject } from '@2060/utils/developer'

interface MobileAgentConfig {
  agentDependencies: AgentDependencies
  mediatorPickupStrategy?: MediatorPickupStrategy
  logger?: Logger
}

let logger: Logger | undefined
if (__DEV__) {
  logger = new ConsoleLogger(LogLevel.off)
}

export const baseAgentConfig: MobileAgentConfig = {
  agentDependencies,
  logger,
  mediatorPickupStrategy: MediatorPickupStrategy.None,
}

const getIndyVDRProxyBaseUrl = async () => {
  const persistedDevEnvs = await getStorageData(DEV_ENVS_PERSIST_KEY)
  if (persistedDevEnvs) {
    return (persistedDevEnvs as DevEnvsObject).INDY_VDR_PROXY_BASE_URL
  }
  return Config.INDY_VDR_PROXY_BASE_URL
}

export const setupMobileAgent = async (config: MobileAgentConfig): Promise<MobileAgent> => {
  const indyVDRProxyBaseUrl = await getIndyVDRProxyBaseUrl()
  const agent = createMobileAgent({
    config: {
      label: 'Hologram',
      logger: config.logger,
      autoUpdateStorageOnStartup: true,
    },
    indyVDRProxyBaseUrl,
    modulesConfig: {
      mediatorPickupStrategy: config.mediatorPickupStrategy,
    },
    dependencies: config.agentDependencies,
  })

  agent.events.on<AgentMessageReceivedEvent>(AgentEventTypes.AgentMessageReceived, async data => {
    config.logger?.info(`Message received ${JSON.stringify(data.payload.message)}`)
  })

  agent.events.on<AgentMessageProcessedEvent>(AgentEventTypes.AgentMessageProcessed, async data => {
    config.logger?.info(`Message received with type: ${data.payload.message.type}`)
  })

  agent.events.on<AgentMessageSentEvent>(AgentEventTypes.AgentMessageSent, async data => {
    config.logger?.info(
      `Message sent (${data.payload.status}): ${JSON.stringify(data.payload.message.message.toJSON())}`,
    )
  })

  const httpOutboundTransporter = new HttpOutboundTransport()
  //const wsOutboundTransporter = new MobileWsOutboundTransport();
  const wsOutboundTransporter = new TunedMobileWsOutboundTransport()

  agent.registerOutboundTransport(httpOutboundTransporter)
  agent.registerOutboundTransport(wsOutboundTransporter)

  agent.dependencyManager.registerMessageHandlerMiddleware(duplicatedMessagesMiddleware)

  return agent
}
