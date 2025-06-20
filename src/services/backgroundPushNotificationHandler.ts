import {
  AgentMessageProcessedEvent,
  V2StatusMessage,
  AgentEventTypes,
  MediatorPickupStrategy,
  TypedArrayEncoder,
} from '@credo-ts/core'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import Config from 'react-native-config'
import Realm from 'realm'

import { baseAgentConfig } from '@2060/hooks/agent/MobileAgentProvider'
import { manageBackgroundChatEntryChanges, subscribeToAgentChatEvents } from '@2060/hooks/agent/chat'
import { manageConnectionStateChangedEvent } from '@2060/hooks/agent/connections/manageConnectionStateChangedEvent'
import { CURRENT_REALM_SCHEMA_VERSION } from '@2060/hooks/providers/RealmProvider'
import { ChatEntry, ChatThread } from '@2060/model'
import { setupMobileAgent } from '@2060/services/initMobileAgent'
import { KeyChainService, retrieveEncryptedKey } from '@2060/services/keys'
import { DEV_ENVS_PERSIST_KEY, getStorageData } from '@2060/services/localStorage'
import { walletDirectoryPath } from '@2060/utils/RNFS'
import { DevEnvsObject } from '@2060/utils/developer'
import { deleteRemoteNotifications } from '@2060/utils/pushNotificationsUtils'

const makeRequestToLocalServer = (payload: Record<string, string>) => {
  if (__DEV__) {
    fetch('http://192.168.1.13:3000/api/echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }
}

const getIndyVDRProxyBaseUrl = async () => {
  const persistedDevEnvs = await getStorageData(DEV_ENVS_PERSIST_KEY)
  if (persistedDevEnvs) {
    return (persistedDevEnvs as DevEnvsObject).INDY_VDR_PROXY_BASE_URL
  }
  return Config.INDY_VDR_PROXY_BASE_URL
}

let isProcessingBackgroundNotification = false

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function backgroundPushNotificationHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
  if (isProcessingBackgroundNotification) {
    makeRequestToLocalServer({ data: 'BACKGROUND PUSH NOTIFICATIONS HANDLER is executing at the moment!!' })
    return
  }
  isProcessingBackgroundNotification = true
  deleteRemoteNotifications()
  makeRequestToLocalServer({ data: 'START EXECUTING BACKGROUND PUSH NOTIFICATIONS HANDLER' })
  try {
    const indyVDRProxyBaseUrl = await getIndyVDRProxyBaseUrl()
    const agent = setupMobileAgent(
      {
        ...baseAgentConfig,
        mediatorPickupStrategy: MediatorPickupStrategy.None,
      },
      indyVDRProxyBaseUrl,
    )

    const realmKey = await retrieveEncryptedKey(KeyChainService.RealmMain)

    const realmConfig: Realm.Configuration = {
      encryptionKey: TypedArrayEncoder.fromHex(realmKey as string),
      schema: [ChatEntry, ChatThread],
      path: `${walletDirectoryPath}/main.realm`,
      schemaVersion: CURRENT_REALM_SCHEMA_VERSION,
    }

    const realm = await Realm.open(realmConfig)
    const { addChatEntryChangeListener, removeChatEntryChangeListener } = manageBackgroundChatEntryChanges(
      realm,
      agent,
    )
    const { addConnectionChangeListener, removeConnectionChangeListener } =
      manageConnectionStateChangedEvent(agent)
    addChatEntryChangeListener()
    addConnectionChangeListener()
    const storage = { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } }
    const getWalletConfig = (storeKey: string) => ({ id: 'afj', key: storeKey, storage })
    const key = await retrieveEncryptedKey(KeyChainService.AfjWallet)
    await agent.wallet.open(getWalletConfig(key as string))

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
          unsubscribeFromAgentChatEvents()
          await agent.shutdown()
          realm.close()
        }
      }
    })
    const unsubscribeFromAgentChatEvents = subscribeToAgentChatEvents(agent, realm, () => undefined)

    await agent.initialize()
    const mediatorConnection = await agent.mediationRecipient.findDefaultMediatorConnection()
    await agent.messagePickup.pickupMessages({
      connectionId: mediatorConnection!.id,
      protocolVersion: 'v2',
    })
  } catch (error) {
    isProcessingBackgroundNotification = false
    makeRequestToLocalServer({ error: JSON.stringify(error) })
  }
}
