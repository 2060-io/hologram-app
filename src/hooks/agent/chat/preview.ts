import { t } from 'i18next'

import {
  ChatEntryData,
  ChatEntryState,
  ChatEntryType,
  ImageMetadata,
  SystemMessageMetadata,
  TextMessageMetadata,
  VideoMetadata,
} from '@src/model'

/**
 * Returns a string containing a localized preview for a given chat entry. It is mostly used
 * to calculate the preview of the last message for a chat thread, and also currently used for
 * preview rendering in replies (TODO: for replies we should return an object containing a text
 * and a thumbnail/icon, as shown in the requirements for replies to pictures and audios )
 * @param chatEntry
 * @returns
 */
export function getLocalizedPreview(chatEntry: ChatEntryData) {
  if (chatEntry.state === ChatEntryState.Deleted) return t('personalChat.messageDeleted')
  const chatEntryTypePreviewMapping: Record<ChatEntryType, string> = {
    [ChatEntryType.ActionMenuSelection]: t('preview.menuSelection'),
    [ChatEntryType.Answer]: t('preview.answer'),
    [ChatEntryType.VCOffer]: t('preview.credentialOffer'),
    [ChatEntryType.VPRequest]: t('preview.presentationRequest'),
    [ChatEntryType.VPResponse]: t('preview.presentation'),
    [ChatEntryType.Image]: t('preview.image'),
    [ChatEntryType.Invitation]: t('preview.invitation'),
    [ChatEntryType.Link]: t('preview.link'),
    [ChatEntryType.Question]: t('preview.question'),
    [ChatEntryType.TextMessage]: (chatEntry.metadata as TextMessageMetadata).content,
    [ChatEntryType.Video]: t('preview.video'),
    [ChatEntryType.VoiceNote]: t('preview.voiceNote'),
    [ChatEntryType.ReportMessage]: t('preview.reportMessage'),
    [ChatEntryType.System]: (chatEntry.metadata as SystemMessageMetadata).text,
    [ChatEntryType.CallOffer]: t('preview.callOffer'),
    [ChatEntryType.MrzRequest]: t('preview.mrzRequest'),
    [ChatEntryType.EMrtdReadRequest]: t('preview.eMrtdReadRequest'),
  }

  return chatEntryTypePreviewMapping[chatEntry.type]
}

/**
 * Gets the thumbnail (if already defined) of a given chat entry. Only supported for images and videos
 *
 * @param chatEntry
 * @returns
 */
export function getThumbnail(chatEntry: ChatEntryData) {
  if (chatEntry.type === ChatEntryType.Image) {
    return (chatEntry.metadata as ImageMetadata)?.preview
  }
  if (chatEntry.type === ChatEntryType.Video) {
    return (chatEntry.metadata as VideoMetadata)?.preview
  }
  return undefined
}
