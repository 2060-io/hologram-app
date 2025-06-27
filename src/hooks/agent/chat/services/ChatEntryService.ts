import { MessageReceipt, MessageState } from '@2060.io/credo-ts-didcomm-receipts'
import { utils } from '@credo-ts/core'
import Realm from 'realm'

import {
  ChatEntry,
  ChatEntryState,
  RelatedEntryProps,
  ChatThread,
  ChatEntryType,
  ChatEntryRole,
} from '@2060/model'

export interface ChatEntryBaseProps {
  chatThreadId: string
  type: ChatEntryType
  role: ChatEntryRole
  state: ChatEntryState
  associatedRecordId?: string
  associatedMessageId?: string
  didcommThreadId?: string
}
export interface ChatEntryStorageProps extends ChatEntryBaseProps {
  id?: string
  createdAt?: number
  lastReadAt?: Date
  metadata?: Record<string, unknown>
  relatedEntryProps?: RelatedEntryProps
}
/** Create a new chat entry
 *
 * @param props record properties
 *
 * @returns created record
 */
export function createChatEntry(realm: Realm, props: ChatEntryStorageProps) {
  const {
    chatThreadId,
    associatedRecordId,
    type,
    role,
    state,
    associatedMessageId,
    metadata,
    createdAt,
    relatedEntryProps,
    didcommThreadId,
  } = props

  const thread = realm.objectForPrimaryKey(ChatThread, chatThreadId)

  if (!thread) throw new Error(`Chat thread not found: ${chatThreadId}`)

  // Ensure that creation time is after thread creation time so security message
  // is displayed first
  const creationTime = Math.max(thread.createdAt.getTime() + 1, createdAt ?? new Date().getTime())

  const chatEntryRecord = realm.write(() => {
    return new ChatEntry(realm, {
      id: utils.uuid(),
      chatThreadId,
      didcommThreadId,
      associatedMessageId,
      associatedRecordId,
      type: type,
      role,
      state,
      metadata,
      createdAt: creationTime,
      unread: props.role === ChatEntryRole.Receiver,
      relatedEntryProps,
    })
  })
  return chatEntryRecord
}

/**
 * Mark a record as read
 *
 * @returns updated record
 */
export function markEntryAsRead(realm: Realm, recordId: string) {
  const record = realm.objectForPrimaryKey(ChatEntry, recordId)
  if (!record) throw new Error(`Cannot find chat element with id ${recordId}`)

  realm.write(() => {
    record.unread = false
  })
}

export function updateChatEntry(
  realm: Realm,
  options: {
    recordId: string
    state: ChatEntryState
    associatedMessageId?: string
    associatedRecordId?: string
    metadata?: Record<string, unknown>
  },
) {
  const { recordId, state, associatedMessageId, associatedRecordId, metadata } = options
  const record = realm.objectForPrimaryKey(ChatEntry, recordId)
  if (!record) throw new Error(`Cannot find chat element with id ${recordId}`)

  realm.write(() => {
    record.state = state

    if (associatedMessageId) {
      record.associatedMessageId = associatedMessageId
      record.didcommThreadId = associatedMessageId
    }

    if (associatedRecordId) {
      record.associatedRecordId = associatedRecordId
    }

    if (metadata) {
      record.metadata = metadata
      record.updatedAt = new Date().getTime()
    }
  })
}

export function addReceiptToRelatedEntries(realm: Realm, receipt: MessageReceipt) {
  const validNewStatesForCurrentState: Record<ChatEntryState, ChatEntryState[]> = {
    created: [
      ChatEntryState.Deleted,
      ChatEntryState.Received,
      ChatEntryState.Submitted,
      ChatEntryState.Viewed,
    ],
    submitted: [ChatEntryState.Received, ChatEntryState.Viewed, ChatEntryState.Deleted],
    received: [ChatEntryState.Viewed, ChatEntryState.Deleted],
    viewed: [ChatEntryState.Deleted],
    deleted: [],
  }

  const receiptToChatEntryStateMap: Record<MessageState, ChatEntryState> = {
    created: ChatEntryState.Created,
    received: ChatEntryState.Received,
    submitted: ChatEntryState.Submitted,
    viewed: ChatEntryState.Viewed,
    deleted: ChatEntryState.Deleted,
  }

  let lastChatEntry: ChatEntry | undefined
  const relatedEntries = findAllByAssociatedMessageId(realm, receipt.messageId)
  realm.write(() => {
    for (const entry of relatedEntries) {
      const entryReceipts = entry.receipts ? entry.receipts : []

      // Check if there is already a receipt for this state
      const existingReceipt = entryReceipts.find(
        item => item.state === receiptToChatEntryStateMap[receipt.state],
      )
      if (!existingReceipt) {
        entryReceipts.push({
          timestamp: receipt.timestamp.getTime(),
          state: receiptToChatEntryStateMap[receipt.state],
        })

        // Particular case: a message is viewed but there is no received receipt. Consider it has been
        // received and viewed at the same time
        if (
          receipt.state === MessageState.Viewed &&
          !entryReceipts.find(item => item.state === ChatEntryState.Received)
        ) {
          entryReceipts.push({ timestamp: receipt.timestamp.getTime(), state: ChatEntryState.Received })
        }

        entry.receipts = entryReceipts
        entry.updatedAt = new Date().getTime()

        if (validNewStatesForCurrentState[entry.state].includes(receiptToChatEntryStateMap[receipt.state])) {
          entry.state = receiptToChatEntryStateMap[receipt.state]
        }
      }

      if (!lastChatEntry || lastChatEntry?.createdAt < entry.createdAt) lastChatEntry = entry
    }
  })

  return lastChatEntry
}

export function updateMetadata(realm: Realm, recordId: string, metadata: Record<string, unknown>) {
  const record = realm.objectForPrimaryKey(ChatEntry, recordId)
  if (!record) throw new Error(`Cannot find chat element with id ${recordId}`)

  realm.write(() => {
    record.metadata = metadata
    record.updatedAt = new Date().getTime()
  })
}

// TODO: optimize query
export function findAllByAssociatedMessageId(realm: Realm, associatedMessageId: string): ChatEntry[] {
  return realm.objects(ChatEntry).filter(item => item.associatedMessageId === associatedMessageId)
}

// TODO: optimize query
export function findAllDidcommThreadId(
  realm: Realm,
  didcommThreadId: string,
  type?: ChatEntryType,
): ChatEntry[] {
  return realm
    .objects(ChatEntry)
    .filter(
      item => item.didcommThreadId === didcommThreadId && (type !== undefined ? item.type === type : true),
    )
}

// TODO: optimize query
export function findAllByAssociatedRecordId(
  realm: Realm,
  associatedRecordId: string,
  type?: ChatEntryType,
): ChatEntry[] {
  return realm
    .objects(ChatEntry)
    .filter(
      item =>
        item.associatedRecordId === associatedRecordId && (type !== undefined ? item.type === type : true),
    )
}

export function deleteEntry(realm: Realm, entryId: string) {
  realm.write(() => {
    realm.delete(entryId)
  })
}
