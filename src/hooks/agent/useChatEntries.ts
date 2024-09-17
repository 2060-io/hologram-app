import { useEffect, useRef, useState } from 'react'

import { useLocalRealm } from '../providers/RealmProvider'

import { useChats } from './ChatProvider'

import { ChatEntry, ChatEntryData, getChatEntryData } from '@2060/model'

const LIMIT_STEP_SIZE = 25

export const useChatEntries = (threadId: string) => {
  const { realm } = useLocalRealm()
  const { loading, setActiveChatThread } = useChats()
  const limit = useRef<number>(LIMIT_STEP_SIZE)
  const [chatEntries, setChatEntries] = useState<ChatEntryData[]>([])

  const loadChatEntries = () => {
    if (!realm || loading) return

    setActiveChatThread(threadId)
    const entries = realm
      .objects(ChatEntry)
      .filtered(`chatThreadId == '${threadId}' SORT(createdAt DESC) LIMIT(${limit.current})`)
      .sorted('createdAt', true)
    limit.current += LIMIT_STEP_SIZE
    setChatEntries(entries.map(getChatEntryData))

    const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = newEntries => {
      setChatEntries(newEntries.map(getChatEntryData))
    }

    entries.addListener(onChatEntryChange)

    return () => {
      entries.removeListener(onChatEntryChange)
      setActiveChatThread(undefined)
    }
  }

  useEffect(() => {
    return loadChatEntries()
  }, [realm])

  return { chatEntries, loadChatEntries }
}
