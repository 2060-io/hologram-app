import { useEffect, useRef, useState } from 'react'
import { Results } from 'realm'

import { useLocalRealm } from '../providers/RealmProvider'

import { useChats } from './ChatProvider'

import { ChatEntry, ChatEntryData, getChatEntryData } from '@2060/model'

const LIMIT_STEP_SIZE = 25

export const useChatEntries = (threadId: string) => {
  const { realm } = useLocalRealm()
  const { loading, setActiveChatThreadId } = useChats()
  const limit = useRef<number>(LIMIT_STEP_SIZE)
  const [chatEntries, setChatEntries] = useState<ChatEntryData[]>([])
  const entries = useRef<Results<ChatEntry>>()

  const updateChatEntryListener = () => {
    const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = (newEntries, changes) => {
      const { newModifications, deletions } = changes
      if (newModifications.length || deletions) {
        setChatEntries(newEntries.map(getChatEntryData))
      }
    }
    entries.current?.addListener(onChatEntryChange)
  }

  const loadChatEntries = () => {
    if (!realm || loading) return
    entries.current?.removeAllListeners()
    setActiveChatThreadId(threadId)
    entries.current = realm
      .objects(ChatEntry)
      .filtered(`chatThreadId == '${threadId}' SORT(createdAt DESC) LIMIT(${limit.current})`)
      .sorted('createdAt', true)
    limit.current += LIMIT_STEP_SIZE
    setChatEntries(entries.current.map(getChatEntryData))
    updateChatEntryListener()
  }

  useEffect(() => {
    return () => {
      entries.current?.removeAllListeners()
      setActiveChatThreadId(undefined)
    }
  }, [realm])

  return { chatEntries, loadChatEntries }
}
