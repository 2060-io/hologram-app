import { AgentMessageProcessedEvent, V2StatusMessage, AgentEventTypes } from '@credo-ts/core'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'

import AgentSingleton from './AgentSingleton'
import RealmSingleton from './RealmSingleton'
import { baseAgentConfig } from './setupMobileAgent'

import { manageBackgroundChatEntryChanges, subscribeToAgentChatEvents } from '@2060/hooks/agent/chat'
import { manageConnectionStateChangedEvent } from '@2060/hooks/agent/connections/manageConnectionStateChangedEvent'
import { log } from '@2060/utils'
import { isBackgroundNotificationHandlerEnabled } from '@2060/utils/developer'
import { arePushNotificationsAllowed, deleteRemoteNotifications } from '@2060/utils/pushNotificationsUtils'

const makeRequestToLocalServer = (payload: Record<string, string>) => {
  if (__DEV__) {
    fetch('http://192.168.1.9:3000/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
}

let isProcessingBackgroundNotification = false

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function backgroundPushNotificationHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
  const persistedIsBackgroundNotificationsEnabled = await isBackgroundNotificationHandlerEnabled()
  if (!persistedIsBackgroundNotificationsEnabled) return
  // Note: When user disables notifications and are not displayed (remote notifications) this code can be
  //  executed. For that reason, we need to check if push notifications are allowed to continue processing
  if (!(await arePushNotificationsAllowed())) return
  deleteRemoteNotifications()
  if (isProcessingBackgroundNotification) {
    makeRequestToLocalServer({ data: 'BACKGROUND PUSH NOTIFICATIONS HANDLER is executing at the moment!!' })
    return
  }
  isProcessingBackgroundNotification = true
  makeRequestToLocalServer({ data: 'START EXECUTING BACKGROUND PUSH NOTIFICATIONS HANDLER' })
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
      log('From backgroundPushNotificationHandler agent is already initialized')
    }
    if (!mobileAgentInstance.getIsAppSubscribedToEvents()) {
      subscribeToAgentChatEvents(agent, realm, false, () => undefined)
    } else {
      log('From backgroundPushNotificationHandler App is already subscribed to agent events')
    }
    const mediatorConnection = await agent.mediationRecipient.findDefaultMediatorConnection()
    await agent.messagePickup.pickupMessages({
      connectionId: mediatorConnection!.id,
      protocolVersion: 'v2',
    })

    // this events is yet calling when app awakes and receives more because agent is still alive and the same
    agent.events.on<AgentMessageProcessedEvent>(AgentEventTypes.AgentMessageProcessed, async data => {
      const message = data.payload.message
      baseAgentConfig.logger?.info(
        `Message processed for connection id ${data.payload.connection?.id} Type: ${message.type}`,
      )
      makeRequestToLocalServer({
        data: `Message processed for connection id ${data.payload.connection?.id}`,
      })
      if (message.type === V2StatusMessage.type.messageTypeUri) {
        const messageCount = (message as V2StatusMessage).messageCount
        baseAgentConfig.logger?.info(`Status message received. Remaining messages: ${messageCount}`)
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
