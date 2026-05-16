import { ChatEntry, ChatEntryState, ChatEntryType } from '@src/model'
import Realm from 'realm'

export const queryOfTypeMedia = `type == '${ChatEntryType.Image}' 
OR type == '${ChatEntryType.Video}' 
OR type == '${ChatEntryType.VoiceNote}'`

/**
 * Retrieves chat entries of type Image, Video, or VoiceNote from the Realm database,
 * excluding entries belonging to the specified chat thread and those marked as Deleted.
 *
 * @param realm - The Realm database instance to query.
 * @param threadId - The ID of the chat thread to exclude from the results.
 * @returns A Realm.Results collection containing the filtered chat entries.
 */
export const getMediaChatEntriesExcludingThread = (realm: Realm, threadId: string) => {
  const mediaChatEntriesExcludingThread = realm
    .objects(ChatEntry)
    .filtered(`chatThreadId != '${threadId}'`)
    .filtered(queryOfTypeMedia)
    .filtered(`state != '${ChatEntryState.Deleted}'`)
  return mediaChatEntriesExcludingThread
}

/**
 * Retrieves the last chat entry of a specified thread from the Realm database.
 *
 * @param realm - The Realm database instance to query.
 * @param threadId - The ID of the chat thread for which to retrieve the last entry.
 * @returns The last chat entry of the specified thread, or undefined if no entries exists.
 */
export const getLastEntryInChatThread = (realm: Realm, threadId: string) => {
  const lastChatEntryOfThread = realm
    .objects(ChatEntry)
    .filtered(`chatThreadId == '${threadId}' SORT(createdAt DESC) LIMIT(1)`)
    .at(0)
  return lastChatEntryOfThread
}
