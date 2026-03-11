import { CacheModuleConfig } from '@credo-ts/core'
import React, { useState, createContext, useEffect, useContext, useCallback, useRef } from 'react'
import EIdReader from 'react-native-eid-reader'

import { useNetwork } from '../useNetwork'

import AgentSingleton from '@src/services/AgentSingleton'
import { isRegistered, MobileAgent } from '@src/services/agent/MobileAgent'
import { MediatorEventTypes } from '@src/services/transport/MediatorEventTypes'
import { TunedMobileWsOutboundTransport } from '@src/services/transport/TunedMobileWsOutboundTransport'
import { logError, logWarn } from '@src/utils'

interface MobileAgentState {
  agent?: MobileAgent
  isSignedUp: boolean
  isInitialized: boolean
  isConnectedToCloudAgent: boolean
}
interface MobileAgentContextInterface extends MobileAgentState {
  openAndInitMobileAgent(): Promise<void>
  shutdownAgent(): Promise<void>
  handleChangeAgentState(state: Partial<MobileAgentState>): void
}

const AgentContext = createContext<MobileAgentContextInterface | undefined>(undefined)

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
  
  const { agent } = agentState
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()
  const mobileAgentInstance = useRef(AgentSingleton.instance)

  useEffect(() => {
    const setAgentInitialState = async () => {
      await mobileAgentInstance.current.setupMobileAgent()
      const newAgent = mobileAgentInstance.current.getMobileAgent()
      if (!newAgent) return
      handleChangeAgentState({ agent: newAgent })
      return () => {
        newAgent.shutdown()
        handleChangeAgentState({ agent: undefined })
      }
    }
    setAgentInitialState()
  }, [])

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

  useEffect(() => {
    if (!isNetworkConnected) handleCloudAgentConnectionUpdate(false)
  }, [isNetworkConnected])

  const handleCloudAgentConnectionUpdate = useCallback(
    (isConnectedToCloudAgent: boolean) => {
      handleChangeAgentState({ isConnectedToCloudAgent: isConnectedToCloudAgent && isNetworkConnected })
    },
    [isNetworkConnected],
  )

  const handleChangeAgentState = (state: Partial<MobileAgentState>) => {
    setAgentState(prevState => ({ ...prevState, ...state }))
  }

  const openAndInitMobileAgent = useCallback(async () => {
    try {
      if (!agent) return
      if (!mobileAgentInstance.current.getMobileAgent()?.isInitialized) {
        await mobileAgentInstance.current.openAndInitMobileAgent()
      } else {
        logWarn(`From main flow Agent is already initialized`)
      }
      // Set NFC support according to the response from EID module
      await agent.modules.mrtd.setMrtdCapabilities({ eMrtdReadSupported: await EIdReader.isNfcSupported() })

      // force loading agent LRU cache into memory (this is to prevent
      // some errors found while accessing it concurrently)
      const cache = agent.dependencyManager.resolve(CacheModuleConfig).cache
      await cache.get(agent.context, 'dummy')

      const isSignedUp = await isRegistered(agent)

      const defaultMediatorConnection = await agent.didcomm.mediationRecipient.findDefaultMediatorConnection()
      let isConnectedToCloudAgent = false
      if (defaultMediatorConnection) {
        for (const transport of agent.didcomm.outboundTransports) {
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
  }, [agent])

  const shutdownAgent = useCallback(async () => {
    try {
      if (!agent) throw new Error('Agent not defined')
      await agent.shutdown()
      handleChangeAgentState({ isConnectedToCloudAgent: false, isInitialized: false, isSignedUp: false })
    } catch (error) {
      logError(`error shutting down agent: ${error}`)
    }
  }, [agentState])

  return (
    <AgentContext value={{ ...agentState, openAndInitMobileAgent, shutdownAgent, handleChangeAgentState }}>
      {children}
    </AgentContext>
  )
}
