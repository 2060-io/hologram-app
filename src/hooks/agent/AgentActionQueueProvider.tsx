import { AgentActionQueueSingleton } from '@src/services/AgentActionQueueSingleton'
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocalRealm } from '../providers/RealmProvider'
import { useNetwork } from '../useNetwork'
import { AgentActionOptions } from './actions/AgentAction'
import { useMobileAgent } from './MobileAgentProvider'

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
  const { netInfo } = useNetwork()
  const agentActionQueueSingleton = AgentActionQueueSingleton.instance
  const queue = agentActionQueueSingleton.getQueue()

  // Track the last known connectivity state so we only stop the queue on a
  // genuine `true -> false` transition. NetInfo's initial state is
  // `isConnected: null` which previously caused a spurious `queue.stop()`
  // during boot and, combined with start/stop races in the underlying
  // library, could leave the queue paused indefinitely.
  const lastConnectedRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!isReady) return
    const isConnected = netInfo.isConnected
    if (isConnected === null) return
    if (isConnected === lastConnectedRef.current) return
    lastConnectedRef.current = isConnected
    if (isConnected) {
      queue.start()
    } else {
      queue.stop()
    }
  }, [netInfo.isConnected, isReady])

  useEffect(() => {
    if (agent?.isInitialized && realm) {
      agentActionQueueSingleton.configureQueue()
      setIsReady(true)
    }
  }, [agent?.isInitialized, realm])

  // Always pass `startQueue: true`. `configureQueue()` already issues a
  // start() and `start()` is idempotent, so this guarantees the job is picked
  // up even if a previous `stop()` left the queue paused.
  const addAgentActionToQueue = useCallback((action: AgentActionOptions) => {
    agentActionQueueSingleton.addJob(action, true)
  }, [])

  return <AgentActionQueueContext value={{ addAgentActionToQueue }}>{children}</AgentActionQueueContext>
}
