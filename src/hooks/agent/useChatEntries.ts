import { useEffect, useRef, useState } from 'react'
import { Results } from 'realm'

import { useLocalRealm } from '../providers/RealmProvider'

import { useChats } from './ChatProvider'

import { ChatEntry, ChatEntryData, getChatEntryData } from '@2060/model'

const LIMIT_STEP_SIZE = 25

export const useChatEntries = (threadId: string) => {
  const { realm } = useLocalRealm()
  const { loading } = useChats()
  const limit = useRef<number>(LIMIT_STEP_SIZE)
  const [chatEntries, setChatEntries] = useState<ChatEntryData[]>([])
  const entries = useRef<Results<ChatEntry>>(undefined)

  const updateChatEntryListener = () => {
    const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = (newEntries, changes) => {
      const { newModifications, deletions, insertions } = changes
      if (insertions.length || newModifications.length || deletions.length) {
        setChatEntries(newEntries.map(getChatEntryData).reverse())
      }
    }
    entries.current?.addListener(onChatEntryChange)
  }

  const loadChatEntries = () => {
    if (!realm || loading) return
    entries.current?.removeAllListeners()
    entries.current = realm
      .objects(ChatEntry)
      .filtered(`chatThreadId == '${threadId}' SORT(createdAt DESC) LIMIT(${limit.current})`)
      .sorted('createdAt', true)
    limit.current += LIMIT_STEP_SIZE
    setChatEntries(entries.current.map(getChatEntryData).reverse())
    updateChatEntryListener()
  }

  useEffect(() => {
    return () => {
      entries.current?.removeAllListeners()
    }
  }, [realm])

  return { chatEntries, loadChatEntries }
}
