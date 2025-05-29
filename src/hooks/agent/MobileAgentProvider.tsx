import { CacheModuleConfig, ConsoleLogger, Logger, LogLevel, MediatorPickupStrategy } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'
import React, { useState, createContext, useEffect, useContext, useCallback } from 'react'
import EIdReader from 'react-native-eid-reader'

import { useConfig } from '../providers/ConfigProvider'
import { useNetwork } from '../useNetwork'

import { isRegistered, MobileAgent } from '@2060/services/agent/MobileAgent'
import { migrateAnonCredsRecords } from '@2060/services/agent/migrateAnonCredsRecords'
import { setupMobileAgent as createMobileAgent, MobileAgentConfig } from '@2060/services/initMobileAgent'
import { MediatorEventTypes } from '@2060/services/transport/MediatorEventTypes'
import { TunedMobileWsOutboundTransport } from '@2060/services/transport/TunedMobileWsOutboundTransport'
import { logError, log } from '@2060/utils'

let logger: Logger | undefined
if (__DEV__) {
  logger = new ConsoleLogger(LogLevel.debug)
}

export const baseAgentConfig: MobileAgentConfig = {
  agentDependencies,
  logger,
  mediatorPickupStrategy: MediatorPickupStrategy.None,
}

interface MobileAgentState {
  agent?: MobileAgent
  isSignedUp: boolean
  isInitialized: boolean
  isConnectedToCloudAgent: boolean
}
export interface MobileAgentContextInterface extends MobileAgentState {
  initMobileAgent(): Promise<void>
  shutdownAgent(): Promise<void>
  handleChangeAgentState(state: Partial<MobileAgentState>): void
}

export const AgentContext = createContext<MobileAgentContextInterface | undefined>(undefined)

export const useMobileAgent = (): MobileAgentContextInterface => {
  const agentContext = useContext(AgentContext)
  if (!agentContext) throw new Error('useMobileAgent must be used within a AgentContextProvider')

  return agentContext
}

interface Props {
  children?: React.ReactNode
}

export const MobileAgentProvider: React.FC<Props> = ({ children }) => {
  const [agentState, setAgentState] = useState<MobileAgentState>({
    isConnectedToCloudAgent: false,
    isInitialized: false,
    isSignedUp: false,
  })

  const agent = agentState.agent
  const { devEnvs } = useConfig()
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()

  const handleChangeAgentState = (state: Partial<MobileAgentState>) => {
    setAgentState(prevState => ({ ...prevState, ...state }))
  }

  const initMobileAgent = useCallback(async () => {
    try {
      if (!agent) throw new Error('Agent not defined')
      await agent.initialize()

      // Set NFC support according to the response from EID module
      await agent.modules.mrtd.setMrtdCapabilities({ eMrtdReadSupported: await EIdReader.isNfcSupported() })

      // force loading agent LRU cache into memory (this is to prevent
      // some errors found while accesing it concurrently)
      const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
      await cache.get(agent.context, 'dummy')

      // Migrate any existing anoncredsRecord to w3c
      await migrateAnonCredsRecords(agent)

      const isSignedUp = await isRegistered(agent)

      const defaultMediatorConnection = await agent.mediationRecipient.findDefaultMediatorConnection()
      let isConnectedToCloudAgent = false
      if (defaultMediatorConnection) {
        for (const transport of agent.outboundTransports) {
          if (transport.supportedSchemes.includes('ws')) {
            isConnectedToCloudAgent = (transport as TunedMobileWsOutboundTransport).isConnectedTo(
              defaultMediatorConnection.id,
            )
          }
        }
      }
      handleChangeAgentState({ isConnectedToCloudAgent, isInitialized: true, isSignedUp })
    } catch (error) {
      logError(`error initializing agent: ${error}`)
    }
  }, [agentState])

  const shutdownAgent = useCallback(async () => {
    try {
      if (!agent) throw new Error('Agent not defined')
      await agent.shutdown()
      handleChangeAgentState({ isConnectedToCloudAgent: false, isInitialized: false, isSignedUp: false })
    } catch (error) {
      logError(`error initializing agent: ${error}`)
    }
  }, [agentState])

  const handleMessagePickupStatus = async () => {
    if (!agent?.isInitialized) return
    try {
      await agent.mediationRecipient.stopMessagePickup()
      if (isNetworkConnected) await agent.mediationRecipient.initiateMessagePickup()
    } catch (error) {
      log(JSON.stringify(error))
    }
  }

  const handleCloudAgentConnectionUpdate = useCallback(
    (isConnectedToCloudAgent: boolean) => {
      handleChangeAgentState({ isConnectedToCloudAgent: isConnectedToCloudAgent && isNetworkConnected })
    },
    [isNetworkConnected],
  )

  useEffect(() => {
    const setInitialState = () => {
      const newAgent = createMobileAgent(baseAgentConfig, devEnvs.INDY_VDR_PROXY_BASE_URL)
      handleChangeAgentState({ agent: newAgent })
      setAgentState(prevState => ({ ...prevState, agent: newAgent }))
      return () => {
        newAgent.shutdown()
        handleChangeAgentState({ agent: undefined })
      }
    }
    setInitialState()
  }, [devEnvs.INDY_VDR_PROXY_BASE_URL])

  useEffect(() => {
    if (!isNetworkConnected) handleCloudAgentConnectionUpdate(false)
  }, [isNetworkConnected])

  useEffect(() => {
    handleMessagePickupStatus()
  }, [agent, isNetworkConnected])

  useEffect(() => {
    if (agent) {
      const connectedListener = () => handleCloudAgentConnectionUpdate(true)
      const disconnectedListener = () => handleCloudAgentConnectionUpdate(false)

      agent.events.on(MediatorEventTypes.MediatorConnected, connectedListener)
      agent.events.on(MediatorEventTypes.MediatorDisconnected, disconnectedListener)

      return () => {
        agent.events.off(MediatorEventTypes.MediatorConnected, connectedListener)
        agent.events.off(MediatorEventTypes.MediatorDisconnected, disconnectedListener)
      }
    }
  }, [agent])

  return (
    <AgentContext.Provider value={{ ...agentState, initMobileAgent, shutdownAgent, handleChangeAgentState }}>
      {children}
    </AgentContext.Provider>
  )
}

export default MobileAgentProvider
