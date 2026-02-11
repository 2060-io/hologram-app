import { t } from 'i18next'
import { useState, useEffect, useMemo } from 'react'

import { useLocalRealm } from '../providers/RealmProvider'
import { useFetchServiceInfo } from '../useFetchServiceInfo'

import { useConnectionById } from './ConnectionsProvider'
import { useUserProfile } from './UserProfileProvider'

import { ChatThreadData, ChatThread, getChatThreadData, ChatEntryRole } from '@src/model'
import { ChatParticipant } from '@src/pages/Chat/ChatMessage/Props'
import {
  getConnectionDisplayName,
  getConnectionDisplayPicture,
  getPictureDataUrl,
  isBlocked,
  isService,
  isTerminated,
  lastTimeProfileReceived,
  lastTimeProfileSent,
  supportsMediaSharing,
  supportsMessageReactions,
  supportsMessageReceipts,
} from '@src/utils/connectionUtils'

export const useUnreadChatThreads = () => {
  return useChatThreadsHook('unreadCount > 0')
}

export type ChatThreadWithParticipants = ReturnType<typeof useChatThreadWithParticipants>

export const useChatThreadWithParticipants = (chatThreadId: string) => {
  const chatThread = useChatThreadById(chatThreadId)
  const connection = useConnectionById(chatThread?.connectionId)
  const { serviceInfo } = useFetchServiceInfo(
    connection && isService(connection) ? connection.invitationDid : undefined,
  )
  const { userProfileData } = useUserProfile()
  const displayPicture = userProfileData?.displayPicture

  const participants: ChatParticipant[] = useMemo(
    () => [
      {
        id: ChatEntryRole.Sender,
        name: t('chat.you'),
        avatar: displayPicture ? getPictureDataUrl(displayPicture) : undefined,
      },
      {
        id: ChatEntryRole.Receiver,
        name: connection ? getConnectionDisplayName(connection) : undefined,
        avatar: connection ? getConnectionDisplayPicture(connection) : undefined,
      },
    ],
    [connection],
  )

  const flags = useMemo(
    () => ({
      serviceInfo,
      isConnectionDeleted: connection === undefined,
      isConnectionBlocked: connection ? isBlocked(connection) : false,
      isConnectionTerminated: connection ? isTerminated(connection) : false,
      isConnectionCompleted: connection ? connection.isReady : false,
      supportsMediaSharing: Boolean(connection && supportsMediaSharing(connection)),
      supportsMessageReceipts: Boolean(connection && supportsMessageReceipts(connection)),
      supportsMessageReactions: Boolean(connection && supportsMessageReactions(connection)),
      lastTimeProfileSent: connection ? lastTimeProfileSent(connection) : undefined,
      myProfileUpdatedAt: userProfileData?.updatedAt,
      lastTimeProfileReceived: connection ? lastTimeProfileReceived(connection) : undefined,
    }),
    [connection, serviceInfo, userProfileData],
  )

  return {
    participants,
    flags,
    data: {
      ...chatThread,
      topic: serviceInfo?.name ?? chatThread?.topic,
      picture: serviceInfo?.logoUrl ?? chatThread?.picture,
    },
  }
}

export const useChatThreadById = (chatThreadId: string) => {
  return useChatThreadsHook(`id == '${chatThreadId}'`)[0]
}

export const useChatThreadsbyParentId = (parentId: string, category: string, topic: string) => {
  const [childChatThreads, setChildChatThreads] = useState<ChatThreadData[]>([])
  const { realm } = useLocalRealm()
  const categoryFilterMapping: Record<string, string> = {
    archived: 'archived == true',
    all: 'archived == false',
  }

  const filterQuery = `
    topic CONTAINS[c] '${topic}' 
    && ${categoryFilterMapping[category]} 
    && parentId == '${parentId}' 
    SORT(lastActivityAt DESC)`

  const chatThreads = realm?.objects(ChatThread).filtered(filterQuery).sorted('lastActivityAt', true)

  const getChatThreadsbyParentId = () => {
    if (!chatThreads) return
    setChildChatThreads(chatThreads.length ? chatThreads.map(getChatThreadData) : [])

    const handleChange: Realm.CollectionChangeCallback<ChatThread> = newChatThreads => {
      setChildChatThreads(newChatThreads.length ? newChatThreads.map(getChatThreadData) : [])
    }

    chatThreads.addListener(handleChange)
    return () => chatThreads.removeListener(handleChange)
  }

  useEffect(() => {
    return getChatThreadsbyParentId()
  }, [category, topic])

  return childChatThreads
}

const useChatThreadsHook = (query: string) => {
  const [data, setData] = useState<ChatThreadData[]>([])
  const { realm } = useLocalRealm()

  useEffect(() => {
    if (realm) {
      const collection = realm.objects(ChatThread).filtered(query)

      setData(collection.length > 0 ? collection.map(getChatThreadData) : [])

      const handleChange: Realm.CollectionChangeCallback<ChatThread> = newChatThreads => {
        setData(newChatThreads.length ? newChatThreads.map(getChatThreadData) : [])
      }

      collection.addListener(handleChange)
      return () => collection.removeListener(handleChange)
    }
  }, [realm])

  return data
}
