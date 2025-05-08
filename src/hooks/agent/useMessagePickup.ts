import { MediatorPickupStrategy } from '@credo-ts/core'
import { useEffect } from 'react'

import { MobileAgent } from '@2060/services/agent'

async function initiateMessagePickup(agent: MobileAgent) {
  agent.config.logger.info('Starting Message Pickup')

  // Iniate message pickup from the mediator. Passing no mediator, will use default mediator
  await agent.mediationRecipient.initiateMessagePickup(undefined, MediatorPickupStrategy.PickUpV2LiveMode)
}

async function stopMessagePickup(agent: MobileAgent) {
  agent.config.logger.info('Stopping Message Pickup')

  // Stop message pickup. Will stopp all message pickup, not just from the mediator
  await agent.mediationRecipient.stopMessagePickup()
}

/**
 * Hook to manage message pickup initialization and stopping based on a flag and component mount/unmount.
 *
 */
export function useMessagePickup({ agent, isEnabled = true }: { agent?: MobileAgent; isEnabled?: boolean }) {
  useEffect(() => {
    if (!agent || !isEnabled) return

    initiateMessagePickup(agent)

    return () => {
      stopMessagePickup(agent)
    }
  }, [isEnabled, agent])
}
