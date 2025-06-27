import { BasicMessageRecord, BasicMessageRole } from '@credo-ts/core'
import Realm from 'realm'

import { getLocalizedPreview, getThumbnail } from '../preview'
import { createChatEntry, findAllDidcommThreadId } from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread, updateThread } from '../services/ChatThreadService'

import { ChatEntryRole, ChatEntryState, ChatEntryType, RelatedEntryProps } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'

export const handleBasicMessageRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: BasicMessageRecord
  activeChatThreadId?: string
  receivedAt?: Date
}) => {
  const { agent, realm, record: basicMessageRecord, activeChatThreadId } = options
  // find associated thread according to the connection id. If not found, create it
  const connection = await agent.connections.getById(basicMessageRecord.connectionId)
  const thread = findOrCreateChatThread(realm, connection)

  if (basicMessageRecord.role === BasicMessageRole.Receiver) {
    createTextChatEntry({
      agent,
      realm,
      associatedRecordId: basicMessageRecord.id,
      associatedMessageId: basicMessageRecord.threadId,
      chatThreadId: thread.id,
      didcommThreadId: basicMessageRecord.threadId,
      role:
        basicMessageRecord.role === BasicMessageRole.Receiver ? ChatEntryRole.Receiver : ChatEntryRole.Sender,
      createdAt: (options.receivedAt ?? new Date(basicMessageRecord.sentTime)).getTime(),
      content: basicMessageRecord.content,
      parentThreadId: basicMessageRecord.parentThreadId,
    })

    if (thread.id !== activeChatThreadId) {
      addUnread(realm, thread.id, 1)
    }
  }
}

export const createTextChatEntry = (options: {
  agent: MobileAgent
  realm: Realm
  role: ChatEntryRole
  content: string
  parentThreadId?: string
  chatThreadId: string
  createdAt?: number
  associatedRecordId?: string
  associatedMessageId?: string
  didcommThreadId?: string
}) => {
  const {
    realm,
    parentThreadId,
    role,
    content,
    associatedMessageId,
    associatedRecordId,
    chatThreadId,
    didcommThreadId,
    createdAt,
  } = options

  let relatedEntryProps: RelatedEntryProps | undefined
  if (parentThreadId) {
    const [relatedChatEntry] = findAllDidcommThreadId(realm, parentThreadId)

    if (relatedChatEntry) {
      relatedEntryProps = {
        chatEntryId: relatedChatEntry.id,
        didcommThreadId: relatedChatEntry.didcommThreadId,
        preview: getLocalizedPreview(relatedChatEntry),
        thumbnail: getThumbnail(relatedChatEntry),
        type: relatedChatEntry.type,
        role: relatedChatEntry.role,
      }
    }
  }

  const chatEntry = createChatEntry(realm, {
    associatedRecordId: associatedRecordId ?? 'dummy', // FIXME: make optional
    associatedMessageId,
    chatThreadId,
    didcommThreadId,
    type: ChatEntryType.TextMessage,
    role,
    state: role === ChatEntryRole.Receiver ? ChatEntryState.Received : ChatEntryState.Created,
    createdAt,
    metadata: { content },
    relatedEntryProps,
  })

  updateThread(realm, chatThreadId, { lastChatEntry: chatEntry })

  return chatEntry
}
