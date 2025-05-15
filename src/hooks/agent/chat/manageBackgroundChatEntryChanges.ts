import notifee, { AndroidGroupAlertBehavior } from '@notifee/react-native'
import Realm from 'realm'

import { getLocalizedPreview } from './preview'

import { IS_ANDROID_DEVICE } from '@2060/constants'
import { ChatEntry, ChatEntryRole, ChatThread } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { getConnectionDisplayName } from '@2060/utils/connectionUtils'
import {
  createChannel,
  LOCAL_NOTIFICATION_ID_PREFIX,
  optionsNotificationAndroid,
  optionsNotificationsIOS,
} from '@2060/utils/pushNotificationsUtils'

export const manageBackgroundChatEntryChanges = (realm: Realm, agent: MobileAgent) => {
  const entries = realm.objects(ChatEntry)

  const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = async (newEntries, changes) => {
    const insertions = changes.insertions
    const channelId = await createChannel()

    for (const index of insertions) {
      const entry = newEntries[index]

      // Only process receiver role entries
      if (entry.role !== ChatEntryRole.Receiver) return

      const [thread] = realm.objects(ChatThread).filtered(`id == '${entry.chatThreadId}'`)

      if (!thread) return

      const connection = await agent.connections.findById(thread.connectionId)
      const groupId = connection?.id
      const data = {
        screen: 'PersonalChat',
        params: { chatThreadId: entry.chatThreadId, connectionId: connection?.id },
      }
      if (IS_ANDROID_DEVICE) {
        await notifee.displayNotification({
          id: `summary-${LOCAL_NOTIFICATION_ID_PREFIX}-chat-${groupId}`,
          data,
          android: {
            channelId,
            pressAction: { id: 'default' },
            groupId,
            groupSummary: true,
            groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
          },
        })
      }
      const newNotification = {
        id: `${LOCAL_NOTIFICATION_ID_PREFIX}-chat-${groupId}-${new Date().getTime()}`,
        title: getConnectionDisplayName(connection!),
        body: `${getLocalizedPreview(entry)}`,
        data,
        android: optionsNotificationAndroid({
          channelId,
          groupId,
          groupAlertBehavior: AndroidGroupAlertBehavior.SUMMARY,
        }),
        ios: optionsNotificationsIOS({ threadId: groupId }),
      }
      notifee.displayNotification(newNotification)
      notifee.incrementBadgeCount()
    }
  }

  const addChatEntryChangeListener = () => {
    entries.addListener(onChatEntryChange)
  }
  const removeChatEntryChangeListener = () => {
    entries.removeListener(onChatEntryChange)
  }

  return {
    addChatEntryChangeListener,
    removeChatEntryChangeListener,
  }
}
