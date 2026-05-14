import { DidCommMessageReceipt, DidCommMessageReceiptOptions, MessageState } from '@2060.io/credo-ts-didcomm-receipts'
import { utils } from '@credo-ts/core'
import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import {
  ChatEntry,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ChatThread,
  ChatThreadData,
  getChatThreadData,
  MediaSharingMetadata,
  SystemMessageMetadata,
} from '@src/model'
import { checkIfDeleteFilesFromMedia } from '@src/pages/Chat/utils'
import AgentSingleton from '@src/services/AgentSingleton'
import { supportsMessageReceipts } from '@src/utils/connectionUtils'
import { getLastEntryInChatThread, getMediaChatEntriesExcludingThread, queryOfTypeMedia } from '@src/utils/realmQueries'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAgentActionQueue } from './AgentActionQueueProvider'
import { AgentActionType } from './actions/AgentAction'
import { SendReceiptsParameters } from './actions/types'
import { addReceiptToRelatedEntries } from './chat/services/ChatEntryService'
import {
  archiveThreads as chatTSArchiveThreads,
  deleteThread as chatTSDeleteThread,
  markThreadAsRead as chatTSMarkThreadAsRead,
  unarchiveThreads as chatTSUnarchiveThreads,
  findOrCreateChatThread,
  updateThread,
} from './chat/services/ChatThreadService'
import { subscribeToAgentChatEvents } from './chat/subscribeToAgentChatEvents'
import { useMobileAgent } from './MobileAgentProvider'

export type ChatCategory = 'all' | 'people' | 'services'
type ChatsFilters = { topic: string; archived: boolean; category: ChatCategory; parentId?: string }

interface CreateThreadOptions {
  connection: DidCommConnectionRecord
}

interface MarkThreadAsReadOptions {
  id: string
  lastReadAt: Date
}

interface ChatsState {
  loading: boolean
  filters: ChatsFilters
  activeChatThreadId: string | undefined
  threads: ChatThreadData[]
}

interface ChatsContextInterface extends ChatsState {
  findOrCreateThread(options: CreateThreadOptions): ChatThreadData
  archiveThreads(chatThreadIds: string[]): void
  unarchiveThreads(chatThreadIds: string[]): void
  markThreadAsRead(options: MarkThreadAsReadOptions): void
  deleteThread(chatThreadId: string): void
  clearChat(threadId: string): void
  setFilters(filters: Partial<ChatsFilters>): void
  setActiveChatThreadId(id: string | undefined): void
}

const ChatsContext = createContext<ChatsContextInterface | undefined>(undefined)

export const useChats = () => {
  const chatsContext = useContext(ChatsContext)
  if (!chatsContext) throw new Error('useChats must be used within a ChatsContextProvider')
  return chatsContext
}

interface Props {
  children?: React.ReactNode
}

export const ChatsProvider: React.FC<Props> = ({ children }) => {
  const { realm } = useLocalRealm()
  const { agent } = useMobileAgent()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [chatsState, setChatsState] = useState<ChatsState>({
    loading: true,
    filters: { topic: '', category: 'all', archived: false },
    activeChatThreadId: undefined,
    threads: [],
  })
  const activeChatThreadId = useRef<undefined | string>(undefined)

  useEffect(() => {
    if (agent && realm) {
      const getActiveChatThreadId = () => {
        return activeChatThreadId.current
      }
      const unsubscribe = subscribeToAgentChatEvents(agent, realm, true, getActiveChatThreadId)
      return () => {
        unsubscribe?.()
        // Allow re-subscription (e.g. after wallet deletion and sign-up again)
        AgentSingleton.instance.setAppIsSubscribedChatToEvents(false)
      }
    }
  }, [agent, realm])

  useEffect(() => {
    return setInitialState()
  }, [agent, realm, chatsState.filters])

  useEffect(() => {
    activeChatThreadId.current = chatsState.activeChatThreadId
  }, [chatsState.activeChatThreadId])

  const setInitialState = () => {
    if (!agent || !realm) return
    const { parentId, category, topic, archived } = chatsState.filters

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
    SORT(lastActivityAt DESC)`
    const chatThreads = realm.objects(ChatThread).filtered(query).sorted('lastActivityAt', true)
    // TODO: implement pagination
    const threads = getFilteredEntries(chatThreads, archived)
    setChatsState((prevState) => ({ ...prevState, threads, loading: false }))

    const onChatThreadChange: Realm.CollectionChangeCallback<ChatThread> = (newChatThreads) => {
      const newThreads = getFilteredEntries(newChatThreads as Realm.Results<ChatThread>, archived)
      setChatsState((prevState) => ({ ...prevState, threads: newThreads }))
    }

    chatThreads.addListener(onChatThreadChange)

    return () => {
      chatThreads.removeListener(onChatThreadChange)
    }
  }

  const getFilteredEntries = (entries: Realm.Results<ChatThread>, archived: boolean) => {
    return entries.length > 0
      ? entries
          // If thread has not any children, check its own archived status. Otherwise, consider not only its
          // own status but also of its children (if any of them matches, accept it)
          .filter((item) =>
            item.subthreads.length === 0
              ? archived === item.archived
              : archived === item.archived || item.subthreads.find((subthread) => archived === subthread.archived)
          )
          .map((item: ChatThread) => {
            const threadData = getChatThreadData(item)
            // Expand archived/unarchived status filtering to subthreads
            return {
              ...threadData,
              subthreads: threadData.subthreads.filter((subthread) => archived === subthread.archived),
            }
          })
      : []
  }

  const setFilters = useCallback((filters: Partial<ChatsFilters>) => {
    setChatsState((prevState) => ({ ...prevState, filters: { ...prevState.filters, ...filters } }))
  }, [])

  const setActiveChatThreadId = useCallback((id: string | undefined) => {
    setChatsState((prevState) => ({ ...prevState, activeChatThreadId: id }))
  }, [])

  const findOrCreateThread = useCallback(
    (options: CreateThreadOptions): ChatThreadData => {
      if (!realm) throw new Error('Realm Unavailable')
      const record = findOrCreateChatThread(realm, options.connection)

      return getChatThreadData(record)
    },
    [realm]
  )

  const archiveThreads = useCallback(
    (chatThreadIds: string[]) => {
      if (!realm) throw new Error('Realm Unavailable')
      chatTSArchiveThreads(realm, chatThreadIds)
    },
    [realm]
  )

  const unarchiveThreads = useCallback(
    (chatThreadIds: string[]) => {
      if (!realm) throw new Error('Realm Unavailable')
      chatTSUnarchiveThreads(realm, chatThreadIds)
    },
    [realm]
  )

  const markThreadAsRead = useCallback(
    async (options: MarkThreadAsReadOptions) => {
      if (!realm) throw new Error('Realm Unavailable')
      const { id, lastReadAt } = options

      const { messageIds, connectionId } = chatTSMarkThreadAsRead(realm, id, lastReadAt)
      const connection = await agent?.didcomm.connections.findById(connectionId)

      // No receipts to send
      if (!connection || !supportsMessageReceipts(connection) || messageIds.length === 0) return

      const receipts: DidCommMessageReceiptOptions[] = messageIds.map((messageId) => ({
        messageId,
        state: MessageState.Viewed,
        timestamp: lastReadAt,
      }))

      for (const receipt of receipts) {
        addReceiptToRelatedEntries(realm, receipt as DidCommMessageReceipt)
      }
      const parameters: SendReceiptsParameters = { connectionId, receipts }
      addAgentActionToQueue({
        type: AgentActionType.SendReceipts,
        parameters,
      })
    },
    [realm]
  )

  const deleteThread = useCallback(
    (chatThreadId: string) => {
      if (!realm) return
      clearChat(chatThreadId)
      chatTSDeleteThread(realm, chatThreadId)
    },
    [realm]
  )

  const clearChat = useCallback(
    (threadId: string) => {
      if (!realm) return
      const chatEntriesToDelete = realm.objects(ChatEntry).filtered(`chatThreadId == '${threadId}'`)
      // Create metadata deep copy of entries type media before delete them
      const metadataOfEntriesTypeMedia: MediaSharingMetadata[] = chatEntriesToDelete
        .filtered(queryOfTypeMedia)
        .map((chatEntry: ChatEntry) => ({ ...(chatEntry.metadata as MediaSharingMetadata) }))
      const thread = realm.objects(ChatThread).find((item) => item.id === threadId)
      realm.write(() => {
        realm.delete(chatEntriesToDelete)
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
      const lastEntryInChatThread = getLastEntryInChatThread(realm, threadId)
      updateThread(realm, threadId, { lastChatEntry: lastEntryInChatThread })
      if (metadataOfEntriesTypeMedia.length) {
        const mediaChatEntriesExcludingThread = getMediaChatEntriesExcludingThread(realm, threadId)
        // iterates all chat entries of type media and check if can delete media files
        for (const metadataOfEntryTypeMedia of metadataOfEntriesTypeMedia) {
          checkIfDeleteFilesFromMedia(metadataOfEntryTypeMedia, mediaChatEntriesExcludingThread)
        }
      }
    },
    [realm]
  )

  return (
    <ChatsContext
      value={{
        ...chatsState,
        setFilters,
        setActiveChatThreadId,
        findOrCreateThread,
        archiveThreads,
        unarchiveThreads,
        markThreadAsRead,
        deleteThread,
        clearChat,
      }}
    >
      {children}
    </ChatsContext>
  )
}
