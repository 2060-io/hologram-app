import Realm from 'realm'

import { ChatEntry, ChatEntryRole, ChatThread } from '@src/model'
import { MobileAgent } from '@src/services/agent'
import { displayNewChatMessageNotification } from '@src/utils/pushNotificationsUtils'

export const manageBackgroundChatEntryChanges = (realm: Realm, agent: MobileAgent) => {
  const entries = realm.objects(ChatEntry)

  const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = async (newChatEntries, changes) => {
    const insertions = changes.insertions
    for (const index of insertions) {
      const entry = newChatEntries[index]
      // Only process receiver role entries
      if (entry.role !== ChatEntryRole.Receiver) return
      const [thread] = realm.objects(ChatThread).filtered(`id == '${entry.chatThreadId}'`)
      if (!thread) return

      const connection = await agent.didcomm.connections.findById(thread.connectionId)
      if (!connection) return
      displayNewChatMessageNotification(connection, entry)
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
