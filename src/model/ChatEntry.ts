import Realm, { ObjectSchema } from 'realm'

import { ChatEntryRole } from './ChatEntryRole'
import { ChatEntryState } from './ChatEntryState'
import { ChatEntryType } from './ChatEntryType'

export type Reaction = {
  emoji: string
  role: ChatEntryRole
}

type Receipt = {
  timestamp: number
  state: ChatEntryState
}

/**
 * - preview: localized text used as a preview
 * - thumbnail: in case of images and videos, a base64-encoded Data URL containing the thumbnail
 */
export type RelatedEntryProps = {
  chatEntryId: string
  type: ChatEntryType
  preview: string
  thumbnail?: string
  didcommThreadId?: string
  role: ChatEntryRole // TODO: This should not be fixed
}

type ChatEntryMetadata = Record<string, unknown>

export interface ChatEntryData {
  id: string
  chatThreadId: string
  type: ChatEntryType
  role: ChatEntryRole
  state: ChatEntryState
  didcommThreadId?: string
  associatedRecordId: string
  associatedMessageId?: string
  createdAt: number
  updatedAt?: number
  unread: boolean
  reactions: Reaction[]
  receipts: Receipt[]
  metadata?: ChatEntryMetadata
  relatedEntryProps?: RelatedEntryProps
}

export class ChatEntry extends Realm.Object<ChatEntry> implements ChatEntryData {
  id!: string
  chatThreadId!: string
  type!: ChatEntryType
  role!: ChatEntryRole
  state!: ChatEntryState
  didcommThreadId?: string
  associatedRecordId!: string // TODO: make optional
  associatedMessageId?: string
  createdAt!: number
  updatedAt?: number
  unread!: boolean
  metadata?: ChatEntryMetadata
  relatedEntryProps?: RelatedEntryProps

  private _reactions!: string[]
  private _receipts!: string[]

  public get reactions(): Reaction[] {
    // eslint-disable-next-line no-underscore-dangle
    return this._reactions.map((item) => JSON.parse(item) as Reaction)
  }

  public set reactions(reactions: Reaction[]) {
    // eslint-disable-next-line no-underscore-dangle
    this._reactions = reactions.map((item) => JSON.stringify(item))
  }

  public get receipts(): Receipt[] {
    // eslint-disable-next-line no-underscore-dangle
    return this._receipts.map((item) => JSON.parse(item) as Receipt)
  }

  public set receipts(receipts: Receipt[]) {
    // eslint-disable-next-line no-underscore-dangle
    this._receipts = receipts.map((item) => JSON.stringify(item))
  }

  static schema: ObjectSchema = {
    name: 'ChatEntry',
    properties: {
      id: { type: 'string' },
      chatThreadId: { type: 'string' },
      type: { type: 'string' },
      role: { type: 'string' },
      state: { type: 'string' },
      associatedRecordId: 'string',
      associatedMessageId: { type: 'string', optional: true },
      didcommThreadId: { type: 'string', optional: true },
      createdAt: { type: 'int', indexed: true },
      updatedAt: { type: 'int', optional: true },
      unread: { type: 'bool' },
      _reactions: { type: 'list', objectType: 'string', optional: true },
      _receipts: { type: 'list', objectType: 'string', optional: true },
      metadata: { type: 'dictionary', objectType: 'mixed', optional: true },
      relatedEntryProps: { type: 'dictionary', objectType: 'mixed', optional: true },
    },
    primaryKey: 'id',
  }
}

export function getChatEntryData(item: ChatEntry): ChatEntryData {
  return {
    id: item.id,
    associatedRecordId: item.associatedRecordId,
    chatThreadId: item.chatThreadId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    type: item.type,
    role: item.role,
    state: item.state,
    unread: item.unread,
    associatedMessageId: item.associatedMessageId,
    didcommThreadId: item.didcommThreadId,
    reactions: item.reactions ? [...item.reactions] : [],
    receipts: item.receipts ? [...item.receipts] : [],
    metadata: item.metadata ? { ...item.metadata } : undefined,
    relatedEntryProps: item.relatedEntryProps ? { ...item.relatedEntryProps } : undefined,
  }
}
