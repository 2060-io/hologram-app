import { utils } from '@credo-ts/core'
import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import Realm from 'realm'

import { getLocalizedPreview } from '../preview'

import {
  ChatEntry,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ChatThread,
  SystemMessageMetadata,
  getChatThreadData,
} from '@src/model'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  getConnectionParentId,
  isService,
} from '@src/utils/connectionUtils'
import { getLastEntryInChatThread } from '@src/utils/realmQueries'

export function findChatThread(realm: Realm, connection: DidCommConnectionRecord) {
  const [thread] = realm.objects(ChatThread).filtered(`connectionId == '${connection.id}'`)
  return thread
}
export function findOrCreateChatThread(realm: Realm, connection: DidCommConnectionRecord) {
  const thread = findChatThread(realm, connection)
  if (thread) {
    // In case it was marked for deletion, re-active it
    if (!thread.active) {
      realm.write(() => {
        thread.active = true
      })
    }
    return thread
  }
  // Find chat thread for parent connection
  let parentThread: ChatThread, parentId: string | undefined
  if (getConnectionParentId(connection)) {
    ;[parentThread] = realm
      .objects(ChatThread)
      .filtered(`connectionId == '${getConnectionParentId(connection)}'`)
    parentId = parentThread?.id
  }

  const chatThreadRecord = realm.write(() => {
    const createdAt = new Date()
    const newThread = new ChatThread(realm, {
      id: utils.uuid(),
      archived: false,
      createdAt,
      lastActivityAt: createdAt,
      connectionId: connection.id,
      picture: getConnectionDisplayPicture(connection),
      topic: getConnectionDisplayName(connection),
      isService: isService(connection),
      parentId,
      subthreads: [],
    })

    if (parentThread) parentThread.subthreads.push(newThread)

    return newThread
  })

  // Create also security message Chat Entry
  realm.write(() => {
    const securityMessageChatEntry = new ChatEntry(realm, {
      id: utils.uuid(),
      chatThreadId: chatThreadRecord.id,
      didcommThreadId: '',
      associatedMessageId: '',
      associatedRecordId: '',
      type: ChatEntryType.System,
      role: ChatEntryRole.None,
      state: ChatEntryState.Viewed,
      metadata: { kind: 'security' } as SystemMessageMetadata,
      createdAt: chatThreadRecord.createdAt.getTime(),
      unread: false,
    })

    return securityMessageChatEntry
  })

  return chatThreadRecord
}

export function addUnread(realm: Realm, threadId: string, count: number) {
  const thread = realm.objectForPrimaryKey(ChatThread, threadId)
  if (!thread) throw new Error(`Cannot find chat element with id ${threadId}`)

  realm.write(() => {
    thread.unreadCount = thread.unreadCount + count
  })
}

/**
 * Marks threads as read and returns a list of DIDComm message Ids for all related
 * entries that have been marked as read
 */
export function markThreadAsRead(realm: Realm, threadId: string, lastReadAt: Date) {
  const messageIds: string[] = []

  const chatThreadData = realm.write(() => {
    const thread = realm.objectForPrimaryKey(ChatThread, threadId)
    if (!thread) throw new Error(`Cannot find chat thread with id ${threadId}`)
    // Find all unread entries for the given thread
    const unreadEntries = realm.objects(ChatEntry).filtered(`chatThreadId == '${threadId}' && unread == true`)

    unreadEntries.forEach(entry => {
      if (entry.associatedMessageId) messageIds.push(entry.associatedMessageId)
      entry.unread = false
    })

    thread.lastReadAt = lastReadAt
    thread.unreadCount = 0
    return getChatThreadData(thread)
  })
  return { messageIds, connectionId: chatThreadData.connectionId }
}

export function archiveThreads(realm: Realm, threadIds: string[]) {
  realm.write(() => {
    for (const threadId of threadIds) {
      const thread = realm.objectForPrimaryKey(ChatThread, threadId)
      if (!thread) throw new Error(`Cannot find chat element with id ${threadId}`)

      thread.archived = true
    }
  })
}

export function unarchiveThreads(realm: Realm, threadIds: string[]) {
  realm.write(() => {
    for (const threadId of threadIds) {
      const thread = realm.objectForPrimaryKey(ChatThread, threadId)
      if (!thread) throw new Error(`Cannot find chat element with id ${threadId}`)

      thread.archived = false
    }
  })
}

export function updateThread(
  realm: Realm,
  threadId: string,
  options: { lastChatEntry?: ChatEntry; topic?: string; picture?: string },
) {
  const thread = realm.objectForPrimaryKey(ChatThread, threadId)
  if (!thread) throw new Error(`Cannot find chat element with id ${threadId}`)

  realm.write(() => {
    if (options.lastChatEntry) {
      const lastActivityAt = new Date(options.lastChatEntry.createdAt)
      thread.lastActivityAt = lastActivityAt
      thread.lastChildActivityAt = lastActivityAt
      thread.preview = getLocalizedPreview(options.lastChatEntry)
      thread.lastChatEntryState =
        options.lastChatEntry.role === ChatEntryRole.Sender ? options.lastChatEntry.state : undefined

      // Find parent chat thread
      if (thread.parentId) {
        const parentThread = realm.objectForPrimaryKey(ChatThread, thread.parentId)
        // Update parent thread last child activity
        if (parentThread) parentThread.lastChildActivityAt = lastActivityAt
      }
    }
    if (options.topic) thread.topic = options.topic
    if (typeof options.picture === 'string') thread.picture = options.picture
  })
}

export function deleteThread(realm: Realm, threadId: string) {
  realm.write(() => {
    const thread = realm.objectForPrimaryKey(ChatThread, threadId)
    if (!thread) throw new Error(`Cannot find chat thread with id ${threadId}`)

    // If it is a parent thread, don't delete but mark it as inactive
    if (thread.subthreads.length > 0) {
      thread.active = false
      return
    }

    // Find parent chat thread
    const parentThreadId = thread.parentId
    if (parentThreadId) {
      const parentThread = realm.objectForPrimaryKey(ChatThread, parentThreadId)
      // Update parent thread subthreads
      if (parentThread) {
        const index = parentThread.subthreads.findIndex(item => item.id === thread.id)
        if (index > 0) parentThread.subthreads.splice(index, 1)

        // In case this was the only child and the parent was marked for deletion, delete it as well
        if (parentThread.subthreads.length === 0 && !parentThread.active) {
          realm.delete(parentThread)
        }
      }
    }
    realm.delete(thread)
  })
}

/**
 * Update the chat thread if the modified chat entry is the last one in the chat
 * This ensures that the thread's last chat entry is always up-to-date.
 *
 * @param realm - The Realm database instance to query.
 * @param updatedChatEntry - The modified chat entry to check against the last entry in the chat.
 */
export function updateThreadIfNeeded(realm: Realm, updatedChatEntry: ChatEntry) {
  const lastEntryInChatThread = getLastEntryInChatThread(realm, updatedChatEntry.chatThreadId)
  if (lastEntryInChatThread) {
    const isThisLastMessageOfChat = updatedChatEntry.id === lastEntryInChatThread.id
    if (isThisLastMessageOfChat) {
      updateThread(realm, updatedChatEntry.chatThreadId, { lastChatEntry: lastEntryInChatThread })
    }
  }
}
