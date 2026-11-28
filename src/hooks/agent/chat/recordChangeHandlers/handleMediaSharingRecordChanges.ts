import { isJsonObject } from '@credo-ts/core'
import { DidCommOutOfBandInvitationV2 } from '@credo-ts/didcomm'
import {
  DidCommMediaSharingRecord,
  DidCommMediaSharingRole,
  DidCommMediaSharingState,
} from '@credo-ts/didcomm-media-sharing'
import {
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ImageMetadata,
  LinkMetadata,
  MediaDownloadState,
  MediaSharingMetadata,
  MediaUploadState,
  RelatedEntryProps,
  VideoMetadata,
  VoiceNoteMetadata,
} from '@src/model'
import { MobileAgent } from '@src/services/agent'
import { receiveV2Invitation } from '@src/services/agent/oob/OutOfBandInvitationV2Handler'
import { logError, logWarn } from '@src/utils'
import Realm from 'realm'
import { getLocalizedPreview, getThumbnail } from '../preview'
import {
  createChatEntry,
  findAllByAssociatedMessageId,
  findAllByAssociatedRecordId,
  updateChatEntry,
} from '../services/ChatEntryService'
import { addUnread, findOrCreateChatThread } from '../services/ChatThreadService'
import { getChatEntryByDidcommThreadId, getChatEntryTypeFromMimeType } from './utils'

const INVITATION_MIME_TYPE = 'application/didcomm-plain+json'

export const handleMediaSharingRecordChanges = async (options: {
  agent: MobileAgent
  realm: Realm
  record: DidCommMediaSharingRecord
  activeChatThreadId?: string
  receivedAt?: Date
}) => {
  const { agent, realm, record, activeChatThreadId } = options
  // find associated thread according to the connection id. If not found, create it
  const connection = await agent.didcomm.connections.getById(record.connectionId)
  const thread = findOrCreateChatThread(realm, connection)

  const [item] = record.items ?? []
  if (item?.mimeType === INVITATION_MIME_TYPE) {
    const messageId = record.threadId ?? record.id
    const isNew = findAllByAssociatedMessageId(realm, messageId).length === 0
    if (record.role !== DidCommMediaSharingRole.Receiver || !isNew) return
    if (!isJsonObject(item.json)) {
      logWarn(`Media sharing record ${record.id} has a ${INVITATION_MIME_TYPE} item with no json object`)
      return
    }
    if (item.json.type !== DidCommOutOfBandInvitationV2.type.messageTypeUri) {
      logWarn(`Media sharing record ${record.id} has a non-invitation ${INVITATION_MIME_TYPE} item: ${item.json.type}`)
      return
    }
    try {
      await receiveV2Invitation(agent.context, {
        v2Invitation: DidCommOutOfBandInvitationV2.fromJson(item.json),
        connection,
        messageId,
        label: (item.metadata?.title as string | undefined) ?? record.description,
        imageUrl: item.metadata?.icon as string | undefined,
      })
    } catch (error) {
      logError(`Error receiving the invitation of media sharing record ${record.id}`, error)
    }
    return
  }

  const data = getChatEntrySpecificData(record)
  if (!data) {
    logWarn(`Media sharing record ${record.id} has no supported item: ${item?.mimeType ?? 'no item'}`)
    return
  }
  const { type, metadata } = data

  let [chatEntry] = findAllByAssociatedRecordId(realm, record.id)
  if (!chatEntry) {
    let relatedEntryProps: RelatedEntryProps | undefined
    if (record.parentThreadId) {
      const { chatEntryRecord: relatedChatEntry, originMessage } = await getChatEntryByDidcommThreadId(
        agent,
        realm,
        record.parentThreadId
      )

      relatedEntryProps = relatedChatEntry
        ? {
            chatEntryId: relatedChatEntry.id,
            didcommThreadId: originMessage.threadId ?? originMessage.id,
            preview: getLocalizedPreview(relatedChatEntry),
            role: relatedChatEntry.role,
            type: relatedChatEntry.type,
            thumbnail: getThumbnail(relatedChatEntry),
          }
        : undefined
    }

    chatEntry = createChatEntry(realm, {
      associatedRecordId: record.id,
      associatedMessageId: record.threadId,
      didcommThreadId: record.threadId,
      chatThreadId: thread.id,
      type,
      role: record.role === DidCommMediaSharingRole.Receiver ? ChatEntryRole.Receiver : ChatEntryRole.Sender,
      state: record.state === DidCommMediaSharingState.MediaShared ? ChatEntryState.Received : ChatEntryState.Created,
      createdAt: (options.receivedAt ?? new Date()).getTime(),
      metadata,
      relatedEntryProps,
    })
    if (record.role === DidCommMediaSharingRole.Receiver && thread.id !== activeChatThreadId) {
      addUnread(realm, thread.id, 1)
    }
  } else {
    updateChatEntry(realm, {
      recordId: chatEntry.id,
      state:
        record.state === DidCommMediaSharingState.MediaShared
          ? record.role === DidCommMediaSharingRole.Sender
            ? ChatEntryState.Submitted
            : ChatEntryState.Received
          : ChatEntryState.Created,
      associatedMessageId: record.threadId,
      metadata,
    })
  }
}

/*
 * Gets appropriate chat entry type, preview and extra metadata properties
 * depending on the mime type of the first media sharing item (currently we only
 * support a single item)
 * @param record
 */
function getChatEntrySpecificData(record: DidCommMediaSharingRecord) {
  const mediaSharingItem = record.items ? record.items[0] : undefined

  // TODO: Log/handle error?
  if (!mediaSharingItem) return

  const baseMetadata: MediaSharingMetadata = {
    description: record.description ?? mediaSharingItem.description,
    mimeType: mediaSharingItem.mimeType,
    byteCount: mediaSharingItem.byteCount,
    filename: mediaSharingItem.fileName,
    localFilePath: record.metadata.get('localFilePath') as string,
    localPreviewFilePath: record.metadata.get('localPreviewFilePath') as string,
    mediaUploadState: record.metadata.get('mediaUploadState') as MediaUploadState,
    mediaUploadProgress: (record.metadata.get('mediaUploadProgress') as number) ?? 0,
    mediaDownloadState: (record.metadata.get('mediaDownloadState') as MediaDownloadState) ?? MediaDownloadState.Pending,
    mediaDownloadProgress: (record.metadata.get('mediaDownloadProgress') as number) ?? undefined,
  }

  let metadata: MediaSharingMetadata | undefined

  const type = getChatEntryTypeFromMimeType(mediaSharingItem.mimeType)
  if (!type) return

  if (type === ChatEntryType.Image) {
    metadata = {
      ...baseMetadata,
      preview: mediaSharingItem.metadata?.preview as string | undefined,
      width: mediaSharingItem.metadata?.width as number | undefined,
      height: mediaSharingItem.metadata?.height as number | undefined,
    } as ImageMetadata
  } else if (type === ChatEntryType.Video) {
    metadata = {
      ...baseMetadata,
      preview: mediaSharingItem.metadata?.preview as string | undefined,
      width: mediaSharingItem.metadata?.width as number | undefined,
      height: mediaSharingItem.metadata?.height as number | undefined,
      duration: mediaSharingItem.metadata?.duration as number | undefined,
    } as VideoMetadata
  } else if (type === ChatEntryType.VoiceNote) {
    metadata = {
      ...baseMetadata,
      preview: mediaSharingItem.metadata?.preview as string | undefined,
      duration: mediaSharingItem.metadata?.duration as number | undefined,
      waveform: (record.metadata.get('waveform') as string) ?? undefined,
    } as VoiceNoteMetadata
  } else if (type === ChatEntryType.Link) {
    metadata = {
      ...baseMetadata,
      uri: mediaSharingItem.uri as string,
      title: mediaSharingItem.metadata?.title as string | undefined,
      icon: mediaSharingItem.metadata?.icon as string | undefined,
      openingMode: mediaSharingItem.metadata?.openingMode as string | undefined,
      screenOrientation: mediaSharingItem.metadata?.screenOrientation as string | undefined,
    } as LinkMetadata
  }

  return {
    type,
    metadata,
  }
}
