import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'
import { addEventListener, NetInfoState, NetInfoStateType } from '@react-native-community/netinfo'
import { MobileAgent } from '@src/services/agent'
import { startLiveModeChecks } from '@src/services/agent/liveModeCheck'
import { closeMediatorSocket, reconnectMediator } from '@src/services/agent/reconnectMediator'
import { log, logWarn } from '@src/utils'
import { useEffect, useRef } from 'react'
import { useLocalRealm } from '../providers/RealmProvider'
import { useScreenLock } from '../providers/ScreenLockProvider'
import { useAppState } from '../useAppState'

/**
 * Hook to manage message pickup initialization and stopping
 */
export function useMessagePickup({ agent, isEnabled }: { agent?: MobileAgent; isEnabled: boolean }) {
  const { realm } = useLocalRealm()
  const { isScreenLockForceDisabled } = useScreenLock()
  const { isAppActive } = useAppState()
  const keptSocketInBackground = useRef(false)

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
        keptSocketInBackground.current = false
        log('App in background ...')
        stopMessagePickup(agent)
        agent.didcomm.outboundTransports[1].stop()
        return () => {
          log('App in foreground ...')
          resumeMessagePickup(agent)
        }
      }
      if (!isAppActive) {
        keptSocketInBackground.current = true
      } else if (keptSocketInBackground.current) {
        keptSocketInBackground.current = false
        // The socket may have gone half-open while in the background
        reconnectMediator(agent, 'app resumed with the socket kept open')
      }
    }
  }, [agent, realm, isAppActive, isScreenLockForceDisabled])

  useEffect(() => {
    if (!agent?.isInitialized || !isEnabled || !isAppActive) return
    return startLiveModeChecks(agent)
  }, [agent, isEnabled, isAppActive])

  useEffect(() => {
    if (!agent) return
    let lastNetwork: string | undefined
    return addEventListener((state) => {
      if (!state.isConnected) {
        lastNetwork = 'none'
        return
      }
      const network = describeNetwork(state)
      if (lastNetwork && network !== lastNetwork) reconnectMediator(agent, `network changed to ${state.type}`)
      lastNetwork = network
    })
  }, [agent])

  useEffect(() => {
    if (!agent?.isInitialized) return
    return () => {
      logWarn('useMessagePickup: Component unmounted, stopping message pickup')
      stopMessagePickup(agent)
    }
  }, [agent])
}

// Cellular details have no IP address, so a change between two cellular networks is not seen here
function describeNetwork(state: NetInfoState): string {
  return state.type === NetInfoStateType.wifi ? `wifi ${state.details?.ipAddress}` : state.type
}

// The background push handler can leave a mediator socket open, and it may be half-open by now
async function resumeMessagePickup(agent: MobileAgent): Promise<void> {
  await closeMediatorSocket(agent, 'app resumed', Date.now()).catch((error) =>
    agent.config.logger.warn('Unable to close the mediator socket on resume', { error })
  )
  await initiateMessagePickup(agent).catch((error) =>
    agent.config.logger.warn('Unable to start message pickup on resume', { error })
  )
}

export async function initiateMessagePickup(agent: MobileAgent) {
  agent.config.logger.info('Starting Message Pickup')

  // Get mediator record to get the mediator connection ID
  const mediatorRecord = await agent.didcomm.mediationRecipient.findDefaultMediator()
  if (!mediatorRecord) {
    agent.config.logger.warn('No mediator record found, skipping message pickup')
    return
  }

  // Credo starts another reconnect monitor on every call, so stop the previous one first
  await agent.didcomm.mediationRecipient.stopMessagePickup()

  // Initiate message pickup from the mediator. We assume that if Coordinate Mediation v1 was used,
  // we are under a DIDComm v1 context and we should use PickUpV2LiveMode, otherwise we use PickUpV4LiveMode
  await agent.didcomm.mediationRecipient.initiateMessagePickup(
    mediatorRecord,
    mediatorRecord.protocolVersion === 'v2'
      ? DidCommMediatorPickupStrategy.PickUpV4LiveMode
      : DidCommMediatorPickupStrategy.PickUpV2LiveMode
  )
}

async function stopMessagePickup(agent: MobileAgent) {
  agent.config.logger.info('Stopping Message Pickup')

  // Stop message pickup. Will stop all message pickup, not just from the mediator
  await agent.didcomm.mediationRecipient.stopMessagePickup()
}
