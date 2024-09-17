import { useEffect } from 'react'

import { useMobileAgent } from '../MobileAgentProvider'

import { manageAgentConnectionEvents } from './manageAgentConnectionEvents'

export const useAgentConnectionEvents = () => {
  const { agent } = useMobileAgent()
  useEffect(() => {
    if (agent) return manageAgentConnectionEvents(agent.context)
  }, [agent])
}
