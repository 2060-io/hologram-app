import { MessageState } from '@2060.io/credo-ts-didcomm-receipts'
import { ConnectionRecord, utils } from '@credo-ts/core'
import React, { createContext, useCallback, useState, useEffect, useContext } from 'react'

import { useMobileAgent } from './MobileAgentProvider'
import { AgentActionOptions, AgentActionType } from './actions/AgentAction'
import { addReceiptToRelatedEntries } from './chat/services/ChatEntryService'
import {
  findOrCreateChatThread,
  archiveThreads as chatESArchiveThreads,
  unarchiveThreads as chatESUnarchiveThreads,
  markThreadAsRead as chatESMarkThreadAsRead,
  deleteThread as chatESDeleteThread,
} from './chat/services/ChatThreadService'
import { useAgentChatEvents } from './chat/useAgentChatEvents'
import { useAgentActionQueue } from './useAgentActionQueue'

import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import {
  ChatThread,
  ChatThreadData,
  ChatEntry,
  getChatThreadData,
  ChatEntryType,
  ChatEntryRole,
  SystemMessageMetadata,
  ChatEntryState,
  MediaSharingMetadata,
} from '@2060/model'
import { checkIfDeleteFilesFromMedia } from '@2060/pages/PersonalChat/utils'
import { supportsMessageReceipts } from '@2060/utils/connectionUtils'
import { getOtherChatEntriesTypeMedia, queryOfTypeMedia } from '@2060/utils/realmQueries'

export type ChatCategory = 'all' | 'people' | 'services'
export type ChatFilters = { topic: string; archived: boolean; category: ChatCategory; parentId?: string }

export interface CreateThreadOptions {
  connection: ConnectionRecord
}

export interface MarkThreadAsReadOptions {
  id: string
  lastReadAt: Date
}

interface ChatState {
  loading: boolean
  filters: ChatFilters
  activeChatThread: string | undefined
  threads: ChatThreadData[]
}

export interface ChatContextInterface extends ChatState {
  findOrCreateThread(options: CreateThreadOptions): ChatThreadData
  archiveThreads(chatThreadIds: string[]): void
  unarchiveThreads(chatThreadIds: string[]): void
  markThreadAsRead(options: MarkThreadAsReadOptions): void
  deleteThread(chatThreadId: string): void
  clearThread(threadId: string): void
  setFilters(filters: Partial<ChatFilters>): void
  setActiveChatThread(id: string | undefined): void
  addAgentActionToQueue(action: AgentActionOptions): void
}

const ChatContext = createContext<ChatContextInterface | undefined>(undefined)

export const useChats = () => {
  const chatContext = useContext(ChatContext)
  if (!chatContext) throw new Error('useChats must be used within a ChatContextProvider')

  return chatContext
}

interface Props {
  children?: React.ReactNode
}

export const ChatProvider: React.FC<Props> = ({ children }) => {
  const [chatState, setChatState] = useState<ChatState>({
    loading: true,
    filters: { topic: '', category: 'all', archived: false },
    activeChatThread: undefined,
    threads: [],
  })

  const { realm } = useLocalRealm()
  const { agent } = useMobileAgent()
  const { addAgentActionToQueue } = useAgentActionQueue()

  const setFilters = useCallback((filters: Partial<ChatFilters>) => {
    setChatState(prevState => ({ ...prevState, filters: { ...prevState.filters, ...filters } }))
  }, [])

  const setActiveChatThread = useCallback((id: string | undefined) => {
    setChatState(prevState => ({ ...prevState, activeChatThread: id }))
  }, [])

  const findOrCreateThread = useCallback(
    (options: CreateThreadOptions): ChatThreadData => {
      if (!realm) throw new Error('Realm Unavailable')
      const record = findOrCreateChatThread(realm, options.connection)

      return getChatThreadData(record)
    },
    [realm],
  )

  const archiveThreads = useCallback(
    (chatThreadIds: string[]) => {
      if (!realm) throw new Error('Realm Unavailable')
      chatESArchiveThreads(realm, chatThreadIds)
    },
    [realm],
  )

  const unarchiveThreads = useCallback(
    (chatThreadIds: string[]) => {
      if (!realm) throw new Error('Realm Unavailable')
      chatESUnarchiveThreads(realm, chatThreadIds)
    },
    [realm],
  )

  const markThreadAsRead = useCallback(
    async (options: MarkThreadAsReadOptions) => {
      if (!realm) throw new Error('Realm Unavailable')
      const { id, lastReadAt } = options

      const { messageIds, connectionId } = chatESMarkThreadAsRead(realm, id, lastReadAt)
      const connection = await agent?.connections.findById(connectionId)

      // No receipts to send
      if (!connection || !supportsMessageReceipts(connection) || messageIds.length === 0) return

      const receipts = messageIds.map(messageId => ({
        messageId,
        state: MessageState.Viewed,
        timestamp: lastReadAt,
      }))

      for (const receipt of receipts) {
        addReceiptToRelatedEntries(realm, receipt)
      }

      addAgentActionToQueue({
        type: AgentActionType.SendReceipts,
        parameters: {
          didcommConnectionId: connectionId,
          receipts: receipts.map(item => ({
            messageId: item.messageId,
            state: item.state,
            timestamp: item.timestamp?.getTime(),
          })),
        },
      })
    },
    [realm],
  )

  const deleteThread = useCallback(
    (chatThreadId: string) => {
      if (!realm) return
      clearThread(chatThreadId)
      chatESDeleteThread(realm, chatThreadId)
    },
    [realm],
  )

  const clearThread = useCallback(
    (threadId: string) => {
      if (!realm) return
      const filteredEntries = realm.objects(ChatEntry).filtered(`chatThreadId == '${threadId}'`)
      // Create metadata deep copy of entries type media before delete them
      const metadataOfEntriesTypeMedia: MediaSharingMetadata[] = filteredEntries
        .filtered(queryOfTypeMedia)
        .map((chatEntry: ChatEntry) => ({ ...(chatEntry.metadata as MediaSharingMetadata) }))
      const thread = realm.objects(ChatThread).find(item => item.id === threadId)
      realm.write(() => {
        realm.delete(filteredEntries)
        // Create security message
        if (!thread) return
        thread.preview = ''
        realm.create<ChatEntry>('ChatEntry', {
          id: utils.uuid(),
          chatThreadId: thread.id,
          didcommThreadId: '',
          associatedMessageId: '',
          associatedRecordId: '',
          type: ChatEntryType.System,
          role: ChatEntryRole.None,
          state: ChatEntryState.Viewed,
          metadata: { kind: 'security' } as SystemMessageMetadata,
          createdAt: thread.createdAt.getTime(),
          unread: false,
        })
      })
      if (metadataOfEntriesTypeMedia.length) {
        const otherChatEntriesTypeMedia = getOtherChatEntriesTypeMedia(realm, threadId)
        // iterates all chat entries of type media and check if can delete media files
        for (const metadataOfEntryTypeMedia of metadataOfEntriesTypeMedia) {
          checkIfDeleteFilesFromMedia(metadataOfEntryTypeMedia, otherChatEntriesTypeMedia)
        }
      }
    },
    [realm],
  )

  const getFilteredEntries = (entries: Realm.Results<ChatThread>, archived: boolean) => {
    return entries.length > 0
      ? entries
          // If thread has not any children, check its own archived status. Otherwise, consider not only its
          // own status but also of its children (if any of them matches, accept it)
          .filter(item =>
            item.subthreads.length === 0
              ? archived === item.archived
              : archived === item.archived ||
                item.subthreads.find(subthread => archived === subthread.archived),
          )
          .map((item: ChatThread) => {
            const threadData = getChatThreadData(item)
            // Expand archived/unarchived status filtering to subthreads
            return {
              ...threadData,
              subthreads: threadData.subthreads.filter(subthread => archived === subthread.archived),
            }
          })
      : []
  }

  const setInitialState = () => {
    if (!agent || !realm) return
    const { parentId, category, topic, archived } = chatState.filters

    const categoryFilterMapping: Record<ChatCategory, string> = {
      all: '',
      people: '&& isService == false',
      services: '&& isService == true',
    }

    const parentFilter = 'parentId == ' + (parentId ? `'${parentId}'` : 'null')

    // TODO: implement pagination
    const query = `topic CONTAINS[c] '${topic}' 
    ${categoryFilterMapping[category]} 
    && ${parentFilter} 
    SORT(lastChildActivityAt DESC)`
    const entries = realm.objects(ChatThread).filtered(query).sorted('lastChildActivityAt', true)

    // TODO: implement pagination
    const threads = getFilteredEntries(entries, archived)
    setChatState(prevState => ({ ...prevState, threads, loading: false }))

    const onChatThreadChange: Realm.CollectionChangeCallback<ChatThread> = newEntries => {
      const newThreads = getFilteredEntries(newEntries as Realm.Results<ChatThread>, archived)
      setChatState(prevState => ({ ...prevState, threads: newThreads }))
    }

    entries.addListener(onChatThreadChange)

    return () => {
      entries.removeListener(onChatThreadChange)
    }
  }

  useEffect(() => {
    return setInitialState()
  }, [agent, realm, chatState.filters])

  useAgentChatEvents(chatState.activeChatThread)

  return (
    <ChatContext.Provider
      value={{
        ...chatState,
        setFilters,
        setActiveChatThread,
        findOrCreateThread,
        archiveThreads,
        unarchiveThreads,
        markThreadAsRead,
        deleteThread,
        clearThread,
        addAgentActionToQueue,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export default ChatProvider
