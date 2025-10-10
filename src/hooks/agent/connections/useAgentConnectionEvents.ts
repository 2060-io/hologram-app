import { useEffect } from 'react'

import { useMobileAgent } from '../MobileAgentProvider'
import { useAgentActionQueue } from '../useAgentActionQueue'

import { manageAgentConnectionEvents } from './manageAgentConnectionEvents'

export const useAgentConnectionEvents = () => {
  const { agent } = useMobileAgent()
  const { addAgentActionToQueue } = useAgentActionQueue()

  useEffect(() => {
    if (agent) return manageAgentConnectionEvents(agent.context, addAgentActionToQueue)
  }, [agent])
}
