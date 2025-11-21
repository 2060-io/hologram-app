import {
  AgentDependencies,
  AgentEventTypes,
  AgentMessageProcessedEvent,
  AgentMessageSentEvent,
  HttpOutboundTransport,
  Logger,
  MediatorPickupStrategy,
  AgentMessageReceivedEvent,
  LogLevel,
} from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import Config from 'react-native-config'

import { appName } from '../../app.json'

import { HologramCustomLogger, HologramCustomLoggerForProd } from './HologramCustomLoggers'
import { MobileAgent } from './agent/MobileAgent'
import { createMobileAgent } from './agent/createMobileAgent'
import { duplicatedMessagesMiddleware } from './agent/duplicatedMessagesMiddleware'
import { DEV_ENVS_PERSIST_KEY, DEVELOPER_MODE_ENABLED_PERSIST_KEY, getStorageData } from './localStorage'
import { TunedMobileWsOutboundTransport } from './transport/TunedMobileWsOutboundTransport'

import { DevEnvsObject } from '@2060/utils/developer'

interface MobileAgentConfig {
  agentDependencies: AgentDependencies
  mediatorPickupStrategy: MediatorPickupStrategy
}

const baseAgentConfig: MobileAgentConfig = {
  agentDependencies,
  mediatorPickupStrategy: MediatorPickupStrategy.None,
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
    logger = new HologramCustomLoggerForProd(LogLevel.debug, isDeveloperMode)
  }
  const agent = createMobileAgent({
    config: {
      label: appName,
      logger,
      autoUpdateStorageOnStartup: true,
    },
    indyVDRProxyBaseUrl,
    modulesConfig: {
      mediatorPickupStrategy: baseAgentConfig.mediatorPickupStrategy,
    },
    dependencies: baseAgentConfig.agentDependencies,
  })

  agent.events.on<AgentMessageReceivedEvent>(AgentEventTypes.AgentMessageReceived, async data => {
    logger.info('Message received', data.payload.message ?? undefined)
  })

  agent.events.on<AgentMessageProcessedEvent>(AgentEventTypes.AgentMessageProcessed, async data => {
    logger.info(`Message received with type: ${data.payload.message.type}`)
  })

  agent.events.on<AgentMessageSentEvent>(AgentEventTypes.AgentMessageSent, async data => {
    logger.info(`Message sent (${data.payload.status})`, data.payload.message.message)
  })

  const httpOutboundTransporter = new HttpOutboundTransport()
  //const wsOutboundTransporter = new MobileWsOutboundTransport();
  const wsOutboundTransporter = new TunedMobileWsOutboundTransport()

  agent.registerOutboundTransport(httpOutboundTransporter)
  agent.registerOutboundTransport(wsOutboundTransporter)

  agent.dependencyManager.registerMessageHandlerMiddleware(duplicatedMessagesMiddleware)

  return agent
}
