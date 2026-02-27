import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'

import { useLocalRealm } from '../providers/RealmProvider'
import { useNetwork } from '../useNetwork'

import { useMobileAgent } from './MobileAgentProvider'
import { AgentActionOptions } from './actions/AgentAction'

import { AgentActionQueueSingleton } from '@src/services/AgentActionQueueSingleton'

type AgentActionQueueContextProps = {
  addAgentActionToQueue: (action: AgentActionOptions) => void
}

export const useAgentActionQueue = () => {
  const agentActionQueueContext = useContext(AgentActionQueueContext)
  if (!agentActionQueueContext) {
    throw new Error('useAgentActionQueue must be used within a AgentActionQueueProvider')
  }
  return agentActionQueueContext
}

const AgentActionQueueContext = createContext<AgentActionQueueContextProps | undefined>(undefined)

export const AgentActionQueueProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { realm } = useLocalRealm()
  const { agent } = useMobileAgent()
  const [isReady, setIsReady] = useState<boolean>(false)
  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()
  const agentActionQueueSingleton = AgentActionQueueSingleton.instance
  const queue = agentActionQueueSingleton.getQueue()

  useEffect(() => {
    if (isNetworkConnected) {
      if (isReady) queue.start()
    } else {
      queue.stop()
    }
  }, [isNetworkConnected, isReady])

  useEffect(() => {
    if (agent?.isInitialized && realm) {
      agentActionQueueSingleton.configureQueue()
      setIsReady(true)
    }
  }, [agent?.isInitialized, realm])

  const addAgentActionToQueue = useCallback(
    (action: AgentActionOptions) => {
      agentActionQueueSingleton.addJob(action, isNetworkConnected)
    },
    [queue, isNetworkConnected],
  )

  return <AgentActionQueueContext value={{ addAgentActionToQueue }}>{children}</AgentActionQueueContext>
}
