import { AgentMessageProcessedEvent, V2StatusMessage, AgentEventTypes } from '@credo-ts/core'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

import { AgentActionQueueSingleton } from './AgentActionQueueSingleton'
import AgentSingleton from './AgentSingleton'
import RealmSingleton from './RealmSingleton'

import { manageBackgroundChatEntryChanges, subscribeToAgentChatEvents } from '@2060/hooks/agent/chat'
import { manageConnectionStateChangedEvent } from '@2060/hooks/agent/connections/manageConnectionStateChangedEvent'
import { subscribeToAgentConnectionEvents } from '@2060/hooks/agent/connections/subscribeToAgentConnectionEvents'
import { log, logWarn } from '@2060/utils'
import { arePushNotificationsAllowed, deleteRemoteNotifications } from '@2060/utils/pushNotificationsUtils'

const makeRequestToLocalServer = (payload: Record<string, string>) => {
  if (__DEV__) {
    fetch('http://172.20.10.3:3000/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
}

let isProcessingBackgroundNotification = false

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function backgroundPushNotificationHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
  // Note: When user disables notifications and are not displayed (remote notifications) this code can be
  //  executed. For that reason, we need to check if push notifications are allowed to continue processing
  if (!(await arePushNotificationsAllowed())) {
    logWarn('User does not have push notifications enabled on device')
    return
  }
  deleteRemoteNotifications()
  if (isProcessingBackgroundNotification) {
    logWarn('BACKGROUND PUSH NOTIFICATIONS HANDLER is executing at the moment!!')
    makeRequestToLocalServer({ data: 'BACKGROUND PUSH NOTIFICATIONS HANDLER is executing at the moment!!' })
    return
  }
  isProcessingBackgroundNotification = true
  logWarn('STARTED EXECUTING BACKGROUND PUSH NOTIFICATIONS HANDLER')
  makeRequestToLocalServer({ data: 'STARTED EXECUTING BACKGROUND PUSH NOTIFICATIONS HANDLER' })
  try {
    const realmInstance = RealmSingleton.instance
    await realmInstance.openRealmIfIsClosed()
    const realm = realmInstance.getRealm()
    if (!realm) return
    const mobileAgentInstance = AgentSingleton.instance
    await mobileAgentInstance.setupMobileAgent()
    const agent = mobileAgentInstance.getMobileAgent()
    if (!agent) return
    const { addChatEntryChangeListener, removeChatEntryChangeListener } = manageBackgroundChatEntryChanges(
      realm,
      agent,
    )
    const { addConnectionChangeListener, removeConnectionChangeListener } =
      manageConnectionStateChangedEvent(agent)
    addChatEntryChangeListener()
    addConnectionChangeListener()
    if (!mobileAgentInstance.getMobileAgent()?.isInitialized) {
      await mobileAgentInstance.openAndInitMobileAgent()
    } else {
      logWarn('From backgroundPushNotificationHandler agent is already initialized')
    }
    AgentActionQueueSingleton.instance.configureQueue()
    if (!mobileAgentInstance.getIsAppSubscribedToChatEvents()) {
      subscribeToAgentChatEvents(agent, realm, false, () => undefined)
    }
    if (!mobileAgentInstance.getIsAppSubscribedToConnectionEvents()) {
      subscribeToAgentConnectionEvents(agent.context)
    }
    const mediatorConnection = await agent.mediationRecipient.findDefaultMediatorConnection()
    await agent.messagePickup.pickupMessages({
      connectionId: mediatorConnection!.id,
      protocolVersion: 'v2',
    })

    // this events is yet calling when app awakes and receives more because agent is still alive and the same
    agent.events.on<AgentMessageProcessedEvent>(AgentEventTypes.AgentMessageProcessed, async data => {
      const message = data.payload.message
      log(`Message processed for connection id ${data.payload.connection?.id} Type: ${message.type}`)
      makeRequestToLocalServer({
        data: `Message processed for connection id ${data.payload.connection?.id}`,
      })
      if (message.type === V2StatusMessage.type.messageTypeUri) {
        const messageCount = (message as V2StatusMessage).messageCount
        log(`Status message received. Remaining messages: ${messageCount}`)
        makeRequestToLocalServer({
          data: `Status message received. Remaining messages: ${messageCount}`,
        })
        if (messageCount === 0) {
          makeRequestToLocalServer({ data: 'BACKGROUND PUSH NOTIFICATIONS HANDLER EXECUTION FINISHED' })
          isProcessingBackgroundNotification = false
          deleteRemoteNotifications()
          removeChatEntryChangeListener()
          removeConnectionChangeListener()
        }
      }
    })
  } catch (error) {
    isProcessingBackgroundNotification = false
    makeRequestToLocalServer({ error: `${error}` })
  }
}
