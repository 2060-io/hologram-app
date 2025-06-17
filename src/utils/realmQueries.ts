import Realm from 'realm'

import { ChatEntry, ChatEntryState, ChatEntryType } from '@2060/model'

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
export const getOtherChatEntriesTypeMedia = (realm: Realm, threadId: string) => {
  const otherEntriesTypeMedia = realm
    .objects(ChatEntry)
    .filtered(`chatThreadId != '${threadId}'`)
    .filtered(queryOfTypeMedia)
    .filtered(`state != '${ChatEntryState.Deleted}'`)

  return otherEntriesTypeMedia
}
