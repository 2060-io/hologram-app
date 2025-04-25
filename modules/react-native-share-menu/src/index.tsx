import { NativeEventEmitter } from 'react-native'

import ShareMenu from './NativeShareMenu'

// Event emitter for listening to native events
const EventEmitter = new NativeEventEmitter(ShareMenu)
const NEW_SHARE_EVENT_NAME = 'NewShareEvent'

type SharedItem = {
  mimeType: string
  data: string
}

export type SharedData = Record<'data', SharedItem[]>

export default {
  getInitialShare(callback: (callback?: { data: { mimeType: string; data: string }[] }) => void) {
    return ShareMenu.getSharedText(callback)
  },
  addNewShareListener(callback: (callback?: { data: { mimeType: string; data: string }[] }) => void) {
    const subscription = EventEmitter.addListener(NEW_SHARE_EVENT_NAME, callback)

    return subscription
  },
}
