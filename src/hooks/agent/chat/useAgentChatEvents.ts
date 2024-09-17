import { useEffect } from 'react'

import { useMobileAgent } from '../MobileAgentProvider'

import { manageAgentChatEvents } from './manageAgentChatEvents'

import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'

export const useAgentChatEvents = (activeChatThread?: string) => {
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()

  useEffect(() => {
    if (agent && realm) {
      return manageAgentChatEvents(agent, realm, activeChatThread)
    }
  }, [agent, realm, activeChatThread])
}
