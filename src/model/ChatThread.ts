import Realm, { ObjectSchema } from 'realm'

import { ChatEntryState } from './ChatEntryState'

export interface ChatThreadData {
  id: string
  connectionId: string
  createdAt: Date
  lastActivityAt: Date
  lastReadAt?: Date
  unreadCount: number
  preview?: string
  lastChatEntryState?: ChatEntryState
  topic?: string
  picture?: string
  archived: boolean
  active: boolean
  isService: boolean
  parentId?: string
  subthreads: ChatThreadData[]
  lastChildActivityAt?: Date
}

export class ChatThread extends Realm.Object<ChatThread> {
  id!: string
  createdAt!: Date
  connectionId!: string
  lastActivityAt!: Date
  lastReadAt?: Date
  unreadCount!: number
  preview?: string
  lastChatEntryState?: ChatEntryState
  topic?: string
  picture?: string
  archived!: boolean
  active!: boolean
  isService!: boolean
  parentId?: string
  subthreads!: Realm.List<ChatThread>
  lastChildActivityAt?: Date

  static schema: ObjectSchema = {
    name: 'ChatThread',
    properties: {
      id: { type: 'string' },
      connectionId: { type: 'string' },
      lastActivityAt: { type: 'date', optional: false },
      lastReadAt: { type: 'date', optional: true },
      unreadCount: { type: 'int', default: 0 },
      preview: { type: 'string', optional: true },
      lastChatEntryState: { type: 'string', optional: true },
      topic: { type: 'string', optional: true },
      picture: { type: 'string', optional: true }, // TODO: Should be a reference to save space
      createdAt: { type: 'date' },
      archived: { type: 'bool', default: false },
      active: { type: 'bool', default: true },
      isService: { type: 'bool', default: false },
      parentId: { type: 'string', optional: true },
      subthreads: {
        type: 'list',
        objectType: 'ChatThread',
      },
      lastChildActivityAt: { type: 'date', optional: true },
    },
    primaryKey: 'id',
  }
}

export function getChatThreadData(item: ChatThread): ChatThreadData {
  return {
    id: item.id,
    active: item.active,
    archived: item.archived,
    connectionId: item.connectionId,
    unreadCount: item.unreadCount,
    createdAt: item.createdAt,
    lastActivityAt: item.lastActivityAt,
    lastChildActivityAt: item.lastChildActivityAt,
    lastReadAt: item.lastReadAt,
    picture: item.picture,
    preview: item.preview,
    topic: item.topic,
    isService: item.isService,
    subthreads: item.subthreads.map(getChatThreadData),
    lastChatEntryState: item.lastChatEntryState,
  }
}
