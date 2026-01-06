import { useEffect, useRef, useState } from 'react'
import { Results } from 'realm'

import { useLocalRealm } from '../providers/RealmProvider'

import { ChatEntry, ChatEntryData, getChatEntryData } from '@2060/model'

const LIMIT_STEP_SIZE = 25

export const useChatEntries = (threadId: string) => {
  const { realm } = useLocalRealm()
  const limit = useRef<number>(LIMIT_STEP_SIZE)
  const [chatEntries, setChatEntries] = useState<ChatEntryData[]>([])
  const entries = useRef<Results<ChatEntry>>(undefined)

  useEffect(() => {
    loadChatEntries()
    return () => {
      entries.current?.removeAllListeners()
    }
  }, [realm])

  const updateChatEntryListener = () => {
    const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = (newEntries, changes) => {
      const { newModifications, deletions, insertions } = changes
      if (insertions.length || newModifications.length || deletions.length) {
        setChatEntries(newEntries.map(getChatEntryData))
      }
    }
    entries.current?.addListener(onChatEntryChange)
  }

  const loadChatEntries = () => {
    if (!realm) return
    entries.current?.removeAllListeners()
    const query = `chatThreadId == '${threadId}' SORT(createdAt DESC) LIMIT(${limit.current})`
    entries.current = realm.objects(ChatEntry).filtered(query)
    const newLoadedChatEntries = entries.current
      .slice(limit.current - LIMIT_STEP_SIZE, limit.current)
      .map(getChatEntryData)
    limit.current += LIMIT_STEP_SIZE
    setChatEntries([...chatEntries, ...newLoadedChatEntries])
    updateChatEntryListener()
  }

  return { chatEntries, loadChatEntries }
}
