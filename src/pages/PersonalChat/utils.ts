import { uuid } from '@credo-ts/core/build/utils/uuid'
import { t } from 'i18next'
import { Results } from 'realm'

import {
  isMediaType,
  MediaSharingMetadata,
  ChatEntryData,
  SystemMessageKind,
  ChatEntryType,
  ChatEntryRole,
  ChatEntryState,
  SystemMessageMetadata,
  ChatEntry,
} from '@2060/model'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import { deleteFile, getLocalFileUri } from '@2060/utils/RNFS'

const buildSystemMessage = (options: {
  kind: SystemMessageKind
  text?: string
  createdAt?: Date
}): ChatEntryMessage => {
  const { kind, text, createdAt } = options
  return {
    id: uuid(),
    createdAt: (createdAt ?? new Date()).getTime(),
    type: ChatEntryType.System,
    associatedRecordId: '', // TODO: make it optional
    chatThreadId: '', // TODO: pass thread id
    reactions: [],
    receipts: [],
    role: ChatEntryRole.None,
    state: ChatEntryState.Created,
    unread: false,
    metadata: {
      kind,
      text,
    } as SystemMessageMetadata,
  }
}

export const getSystemMessage = (options: {
  isConnectionCompleted: boolean
  isConnectionBlocked: boolean
  isConnectionTerminated: boolean
  isConnectionDeleted: boolean
  displayName?: string
}): ChatEntryMessage | null => {
  const {
    isConnectionCompleted,
    isConnectionBlocked,
    isConnectionTerminated,
    isConnectionDeleted,
    displayName,
  } = options

  if (isConnectionDeleted) {
    return buildSystemMessage({ kind: 'deleted', text: t('personalChat.connectionDeleted') })
  }

  if (isConnectionTerminated) {
    return buildSystemMessage({ kind: 'terminated', text: t('personalChat.connectionTerminated') })
  }

  if (isConnectionBlocked) {
    return buildSystemMessage({ kind: 'blocked', text: t('personalChat.blockedThisConnection') })
  }

  if (!isConnectionCompleted) {
    return buildSystemMessage({
      kind: 'pending',
      text: t('personalChat.waitingAcceptInvitation', { name: displayName }),
    })
  }

  return null
}

export function isSameUser(currentMessage: ChatEntryMessage, diffMessage: ChatEntryMessage | undefined) {
  return !!(diffMessage && diffMessage.role === currentMessage.role)
}

/**
 *  Checks if two given chat entries are equivalent in terms of UI representation
 * */
export const chatEntryEqual = (obj1: ChatEntryData, obj2: ChatEntryData): boolean => {
  // First check if basic properties equal
  const equalBasicProperties =
    obj1.id === obj2.id &&
    obj1.unread === obj2.unread &&
    obj1.state === obj2.state &&
    obj1.updatedAt === obj2.updatedAt &&
    obj1.role === obj2.role

  if (!equalBasicProperties) return false

  // Now compare metadata (dependent on entry type)
  if (isMediaType(obj1.type)) {
    const obj1Metadata = obj1.metadata as MediaSharingMetadata
    const obj2Metadata = obj2.metadata as MediaSharingMetadata
    if (
      obj1Metadata.mediaUploadState !== obj2Metadata.mediaUploadState ||
      obj1Metadata.mediaDownloadState !== obj2Metadata.mediaDownloadState ||
      obj1Metadata.mediaDownloadProgress !== obj2Metadata.mediaDownloadProgress
    ) {
      return false
    }
  }

  return true
}

const pad = (num: number) => ('0' + num).slice(-2)

/**
 * Function that receives a duration of media in milliseconds and returns its values
 * in the next format example: 01:10 where 01 is related to minutes and 10 is related to seconds
 * @param milliseconds number
 * @returns string
 */
export const getMinutesAndSeconds = (milliseconds: number) => {
  const secs = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(secs / 60)
  const seconds = secs % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

/**
 * Checks if the media file associated with a chat message should be deleted from local storage.
 * This function examines the provided message metadata to determine if its local file path is still
 * referenced by any other chat entries of type media. If the file path is not referenced elsewhere,
 * it deletes the file and its preview (if present) from local storage.
 *
 * @param messageMetadata - The metadata of the chat entry whose media files may be deleted.
 * @param otherChatEntriesTypeMedia - Array of other chat entries of type media to check for references
 *  to the same file path.
 */
export const checkIfDeleteFilesFromMedia = async (
  metadata: MediaSharingMetadata | undefined,
  otherChatEntriesTypeMedia: never[] | Results<ChatEntry>,
) => {
  if (metadata?.localFilePath) {
    const isLocalFilePathReferencedInOtherChatEntry = otherChatEntriesTypeMedia.some(
      otherEntryTypeMedia =>
        (otherEntryTypeMedia.metadata as MediaSharingMetadata).localFilePath === metadata.localFilePath,
    )
    if (!isLocalFilePathReferencedInOtherChatEntry) {
      await deleteFile(getLocalFileUri(metadata.localFilePath))
      if (metadata.localPreviewFilePath) {
        await deleteFile(getLocalFileUri(metadata.localPreviewFilePath))
      }
    }
  }
}
