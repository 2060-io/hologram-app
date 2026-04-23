import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'
import { useEffect } from 'react'

import { useLocalRealm } from '../providers/RealmProvider'
import { useScreenLock } from '../providers/ScreenLockProvider'
import { useAppState } from '../useAppState'

import { MobileAgent } from '@src/services/agent'
import { log, logWarn } from '@src/utils'

/**
 * Hook to manage message pickup initialization and stopping
 */
export function useMessagePickup({ agent, isEnabled }: { agent?: MobileAgent; isEnabled: boolean }) {
  const { realm } = useLocalRealm()
  const { isScreenLockForceDisabled } = useScreenLock()
  const { isAppActive } = useAppState()

  useEffect(() => {
    if (!agent?.isInitialized) return
    if (isEnabled) {
      initiateMessagePickup(agent)
    } else {
      stopMessagePickup(agent)
    }
  }, [isEnabled, agent])

  useEffect(() => {
    // FIXME: accessing realm is currently making the app crash in dev environment.
    // We can probably disable the whole logic if running under __DEV__
    if (agent && agent.isInitialized && realm) {
      if (!isAppActive && !isScreenLockForceDisabled) {
        log('App in background ...')
        stopMessagePickup(agent)
        agent.didcomm.outboundTransports[1].stop()
        return () => {
          log('App in foreground ...')
          initiateMessagePickup(agent)
        }
      }
    }
  }, [agent, realm, isAppActive, isScreenLockForceDisabled])

  useEffect(() => {
    if (!agent?.isInitialized) return
    return () => {
      logWarn('useMessagePickup: Component unmounted, stopping message pickup')
      stopMessagePickup(agent)
    }
  }, [agent])
}

export async function initiateMessagePickup(agent: MobileAgent) {
  agent.config.logger.info('Starting Message Pickup')

  // Get mediator record to get the mediator connection ID
  const mediatorRecord = await agent.didcomm.mediationRecipient.findDefaultMediator()
  if (!mediatorRecord) {
    agent.config.logger.warn('No mediator record found, skipping message pickup')
    return
  }

  // Initiate message pickup from the mediator. We assume that if Coordinate Mediation v1 was used,
  // we are under a DIDComm v1 context and we should use PickUpV2LiveMode, otherwise we use PickUpV3LiveMode
  await agent.didcomm.mediationRecipient.initiateMessagePickup(
    mediatorRecord,
    mediatorRecord.mediationProtocolVersion === 'v2'
      ? DidCommMediatorPickupStrategy.PickUpV3LiveMode
      : DidCommMediatorPickupStrategy.PickUpV2LiveMode,
  )
}

async function stopMessagePickup(agent: MobileAgent) {
  agent.config.logger.info('Stopping Message Pickup')

  // Stop message pickup. Will stop all message pickup, not just from the mediator
  await agent.didcomm.mediationRecipient.stopMessagePickup()
}
