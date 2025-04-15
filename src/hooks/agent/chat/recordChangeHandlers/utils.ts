import { MediaSharingRecord } from '@2060.io/credo-ts-didcomm-media-sharing'
import { BasicMessageRecord } from '@credo-ts/core'
import Realm from 'realm'

import { findAllByAssociatedRecordId } from '../services/ChatEntryService'

import { ChatEntryType } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'

// FIXME: This first tries in BasicMessage repo and then in MediaSharing repo. It sould be actually a tag in
// ChatEntryRecord, as we only need the record itself and its didcommThreadId
export async function getChatEntryByDidcommThreadId(agent: MobileAgent, realm: Realm, threadId: string) {
  let originMessage: BasicMessageRecord | MediaSharingRecord
  try {
    originMessage = await agent.basicMessages.getByThreadId(threadId)
  } catch (error) {
    // TODO: Use findByThreadId (update to media sharing is required)
    ;[originMessage] = (await agent.modules.media.getAll()).filter(item => item.threadId === threadId)
  }
  const [chatEntryRecord] = findAllByAssociatedRecordId(realm, originMessage.id)

  return { chatEntryRecord, originMessage }
}

export function getChatEntryTypeFromMimeType(mimeType: string) {
  const typeMapping: Record<string, ChatEntryType> = {
    image: ChatEntryType.Image,
    audio: ChatEntryType.VoiceNote,
    video: ChatEntryType.Video,
    text: ChatEntryType.Link,
  }

  return typeMapping[mimeType.split('/')[0]]
}
