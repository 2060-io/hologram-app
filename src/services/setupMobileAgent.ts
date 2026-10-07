import { AgentDependencies, Logger, LogLevel } from '@credo-ts/core'
import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'
import { agentDependencies } from '@credo-ts/react-native'
import { areLogsEnabled, DevEnvsObject, parseDidcommVersions } from '@src/utils/developer'
import Config from 'react-native-config'
import { createMobileAgent } from './agent/createMobileAgent'
import { subscribeToDidCommTraceEvents } from './agent/didcommTrace'
import { duplicatedMessagesMiddleware } from './agent/duplicatedMessagesMiddleware'
import { MobileAgent } from './agent/MobileAgent'
import { HologramCustomLogger } from './HologramCustomLoggers'
import { DEV_ENVS_PERSIST_KEY, getStorageData } from './localStorage'

interface MobileAgentConfig {
  agentDependencies: AgentDependencies
  mediatorPickupStrategy: DidCommMediatorPickupStrategy
}

const baseAgentConfig: MobileAgentConfig = {
  agentDependencies,
  mediatorPickupStrategy: DidCommMediatorPickupStrategy.PickUpV4LiveMode,
}

const getDevEnvValue = async (key: keyof DevEnvsObject): Promise<string | undefined> => {
  const persistedDevEnvs = await getStorageData(DEV_ENVS_PERSIST_KEY)
  if (persistedDevEnvs) {
    return (persistedDevEnvs as DevEnvsObject)[key]
  }
  return undefined
}

const getIndyVDRProxyBaseUrl = async () => {
  return (await getDevEnvValue('INDY_VDR_PROXY_BASE_URL')) ?? Config.INDY_VDR_PROXY_BASE_URL
}

const getDidcommVersions = async () => {
  const persisted = await getDevEnvValue('SUPPORTED_DIDCOMM_VERSIONS')
  return parseDidcommVersions(persisted ?? Config.SUPPORTED_DIDCOMM_VERSIONS)
}

let logger: Logger
export const setupMobileAgent = async (): Promise<MobileAgent> => {
  const indyVDRProxyBaseUrl = await getIndyVDRProxyBaseUrl()
  const didcommVersions = await getDidcommVersions()
  if (__DEV__) {
    logger = new HologramCustomLogger(LogLevel.Debug)
  } else {
    const logsEnabled = await areLogsEnabled()
    logger = new HologramCustomLogger(logsEnabled ? LogLevel.Debug : LogLevel.Warn)
  }
  const agent = createMobileAgent({
    config: {
      logger,
      autoUpdateStorageOnStartup: true,
    },
    indyVDRProxyBaseUrl,
    modulesConfig: {
      mediatorPickupStrategy: baseAgentConfig.mediatorPickupStrategy,
      didcommVersions,
    },
    dependencies: baseAgentConfig.agentDependencies,
  })

  subscribeToDidCommTraceEvents(agent, logger)

  agent.didcomm.registerMessageHandlerMiddleware(duplicatedMessagesMiddleware)

  return agent
}
