import { DidCommEventTypes } from '@credo-ts/didcomm'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import { manageBackgroundChatEntryChanges, subscribeToAgentChatEvents } from '@src/hooks/agent/chat'
import { manageConnectionStateChangedEvent } from '@src/hooks/agent/connections/manageConnectionStateChangedEvent'
import { subscribeToAgentConnectionEvents } from '@src/hooks/agent/connections/subscribeToAgentConnectionEvents'
import { logWarn } from '@src/utils'
import { arePushNotificationsAllowed, deleteRemoteNotifications } from '@src/utils/pushNotificationsUtils'
import { AgentActionQueueSingleton } from './AgentActionQueueSingleton'
import AgentSingleton from './AgentSingleton'
import { MobileAgent } from './agent/MobileAgent'
import { closeMediatorSocket } from './agent/reconnectMediator'
import RealmSingleton from './RealmSingleton'

const SETTLE_QUIET_MS = 2_000
const SETTLE_MAX_MS = 10_000

let isProcessingBackgroundNotification = false
let skippedPush: FirebaseMessagingTypes.RemoteMessage | undefined

export async function backgroundPushNotificationHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
  // Note: When user disables notifications and are not displayed (remote notifications) this code can be
  //  executed. For that reason, we need to check if push notifications are allowed to continue processing
  if (!(await arePushNotificationsAllowed())) {
    logWarn('User does not have push notifications enabled on device')
    return
  }
  deleteRemoteNotifications()
  if (isProcessingBackgroundNotification) {
    skippedPush = remoteMessage
    return
  }
  isProcessingBackgroundNotification = true
  let processingSettled = async (): Promise<void> => {}
  let removeListeners = (): void => {}
  try {
    const realmInstance = RealmSingleton.instance
    await realmInstance.openRealmIfIsClosed()
    const realm = realmInstance.getRealm()
    if (!realm) return
    const mobileAgentInstance = AgentSingleton.instance
    await mobileAgentInstance.setupMobileAgent()
    const agent = mobileAgentInstance.getMobileAgent()
    if (!agent) return
    const { addChatEntryChangeListener, removeChatEntryChangeListener } = manageBackgroundChatEntryChanges(realm, agent)
    const { addConnectionChangeListener, removeConnectionChangeListener } = manageConnectionStateChangedEvent(agent)
    addChatEntryChangeListener()
    addConnectionChangeListener()
    processingSettled = () => waitForProcessingToSettle(agent)
    removeListeners = () => {
      removeChatEntryChangeListener()
      removeConnectionChangeListener()
    }
    if (!mobileAgentInstance.getMobileAgent()?.isInitialized) {
      await mobileAgentInstance.openAndInitMobileAgent()
    }
    AgentActionQueueSingleton.instance.configureQueue()
    if (!mobileAgentInstance.getIsAppSubscribedToChatEvents()) {
      subscribeToAgentChatEvents(agent, realm, false, () => undefined)
    }
    if (!mobileAgentInstance.getIsAppSubscribedToConnectionEvents()) {
      subscribeToAgentConnectionEvents(agent.context)
    }
    const mediatorRecord = await agent.didcomm.mediationRecipient.findDefaultMediator()
    if (!mediatorRecord) return
    // A socket left open by an earlier run may be half-open by now, and a push means it is not live anyway
    await closeMediatorSocket(agent, 'background push', Date.now())
    await agent.didcomm.messagePickup.pickupMessages({
      connectionId: mediatorRecord.connectionId,
      protocolVersion: mediatorRecord.protocolVersion === 'v2' ? 'v4' : 'v2',
      awaitCompletion: true,
    })
    deleteRemoteNotifications()
  } catch (error) {
    logWarn(`Background push handling failed: ${error}`)
  } finally {
    await processingSettled()
    isProcessingBackgroundNotification = false
    removeListeners()
    if (skippedPush) {
      const missedPush = skippedPush
      skippedPush = undefined
      // That push may be for a message queued after this run's last status reply
      await backgroundPushNotificationHandler(missedPush)
    }
  }
}

// Pickup completes before the delivered messages are stored, and the notifications come from listeners on those writes
function waitForProcessingToSettle(agent: MobileAgent): Promise<void> {
  return new Promise((resolve) => {
    let quietTimer = setTimeout(settled, SETTLE_QUIET_MS)
    const maxTimer = setTimeout(settled, SETTLE_MAX_MS)
    const onProcessed = (): void => {
      clearTimeout(quietTimer)
      quietTimer = setTimeout(settled, SETTLE_QUIET_MS)
    }
    agent.events.on(DidCommEventTypes.DidCommMessageProcessed, onProcessed)

    function settled(): void {
      clearTimeout(quietTimer)
      clearTimeout(maxTimer)
      agent.events.off(DidCommEventTypes.DidCommMessageProcessed, onProcessed)
      resolve()
    }
  })
}
