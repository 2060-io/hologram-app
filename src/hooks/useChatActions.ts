import { MessageReactionAction } from '@2060.io/credo-ts-didcomm-reactions'
import { MessageReceiptOptions, MessageState } from '@2060.io/credo-ts-didcomm-receipts'
import { ActionMenuRole, ActionMenuState } from '@credo-ts/action-menu'
import { CameraRoll } from '@react-native-camera-roll/camera-roll'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Share, { ShareOptions } from 'react-native-share'
import { SharedData } from 'react-native-share-menu'

import {
  useMobileAgent,
  useUserProfile,
  useChat,
  useFileUploadDownload,
  RepliedMessage,
  useChats,
  AgentActionType,
  DidCommMediaFileSharingData,
} from './agent'
import { getLocalizedPreview, getThumbnail } from './agent/chat/preview'
import { createTextChatEntry } from './agent/chat/recordChangeHandlers/handleBasicMessageRecordChanges'
import { createChatEntry, findOrCreateChatThread, updateThread } from './agent/chat/services'
import { useLocalRealm } from './providers/RealmProvider'

import { MAX_VIDEO_DURATION } from '@2060/constants'
import {
  ActionMenuSelectionMetadata,
  ChatEntry,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ChatThread,
  MediaSharingMetadata,
  TextMessageMetadata,
  isMediaType,
} from '@2060/model'
import { ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import { checkIfDeleteFilesFromMedia } from '@2060/pages/PersonalChat/utils'
import { log, logError } from '@2060/utils'
import { getLocalFileUri } from '@2060/utils/RNFS'
import { compressVideo, getMediaFileSharingData } from '@2060/utils/mediaFileUtils'
import { getOtherChatEntriesTypeMedia } from '@2060/utils/realmQueries'
import { toast, ToastOptions } from '@2060/utils/toast'

export const useChatActions = () => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { userProfileData } = useUserProfile()
  const { setRepliedMessage, repliedMessage, selectedMessages, chatThread } = useChat()
  const connectionId = chatThread?.data.connectionId
  const { startMediaUpload } = useFileUploadDownload()
  const { realm } = useLocalRealm()
  const { addAgentActionToQueue } = useChats()

  const onClearRepliedMessageState = () => setRepliedMessage()

  const shareMediaToApp = useCallback(async (message: ChatEntryMessage) => {
    const { fileType, mimeType, localFilePath } = extractDataFromMessage(message)
    const path = getLocalFileUri(localFilePath)
    const [, subType] = mimeType.split('/')
    const textType = fileType[0].toUpperCase() + fileType.slice(1)
    const url = `file://${path}`
    const title = `Share ${textType}`
    const options = Platform.select<ShareOptions>({
      ios: {
        url,
        title,
        type: mimeType,
        filename: `${textType}.${subType}`,
      },
      android: {
        url,
        title,
        type: mimeType,
        message: `${textType} from ${userProfileData?.displayName ?? '2060'}`,
        filename: `${textType}.${subType}`,
        failOnCancel: true,
        showAppsToView: true,
        subject: title,
      },
      default: {},
    })
    return Share.open(options)
  }, [])

  const saveFileToGallery = useCallback(async (message: ChatEntryMessage) => {
    try {
      const { localFilePath } = extractDataFromMessage(message)
      const path = getLocalFileUri(localFilePath)
      await CameraRoll.saveAsset(path)
      toast({ type: 'success', message: t('personalChat.saveSucceededFileMedia') })
    } catch (error) {
      toast({ type: 'error', message: t('personalChat.saveFailedFileMedia') })
    }
  }, [])

  const deleteMessagesForMe = useCallback(
    (messages: ChatEntryMessage[]) => {
      return new Promise<void>((resolve, reject) => {
        if (!realm) return
        try {
          const isSomeMessageTypeMedia = messages.some(message => isMediaType(message.type))
          const otherChatEntriesTypeMedia = isSomeMessageTypeMedia
            ? getOtherChatEntriesTypeMedia(realm, messages[0].chatThreadId)
            : []
          messages.forEach(message => {
            const { id } = message
            realm.write(() => {
              const object = realm.objectForPrimaryKey(ChatEntry, id)
              if (!object) throw new Error(`ChatEntry with id ${id} not found`)
              realm.delete(object)
            })
            if (isMediaType(message.type)) {
              checkIfDeleteFilesFromMedia(message.metadata as MediaSharingMetadata, otherChatEntriesTypeMedia)
            }
          })
          toast({
            type: 'success',
            message: t('personalChat.messageDeletedSuccessfully', { count: messages.length }),
          })
          resolve()
        } catch (error) {
          logError('Error deleting messages', error)
          toast({ type: 'error', message: t('personalChat.messageUnsuccessfulDeletion') })
          reject(`${error}`)
        }
      })
    },
    [realm],
  )

  const deleteMessagesForEveryone = useCallback(
    async (messages: ChatEntryMessage[]) => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!agent || !connectionId || !realm) return
          const receipts: MessageReceiptOptions[] = []
          const isSomeMessageTypeMedia = messages.some(message => isMediaType(message.type))
          const otherChatEntriesTypeMedia = isSomeMessageTypeMedia
            ? getOtherChatEntriesTypeMedia(realm, messages[0].chatThreadId)
            : []
          messages.forEach(message => {
            const { id: entryId, associatedMessageId } = message
            realm.write(() => {
              const object = realm.objectForPrimaryKey(ChatEntry, entryId)
              if (!object) throw new Error(`ChatEntry with id ${entryId} not found`)
              object.state = ChatEntryState.Deleted
              const thread = realm.objectForPrimaryKey(ChatThread, object.chatThreadId)
              if (!thread) throw new Error(`Thread with id ${object.chatThreadId} not found`)
              if (thread?.lastActivityAt?.getTime() === object.createdAt) {
                thread.preview = getLocalizedPreview({ ...message, state: ChatEntryState.Deleted })
              }
            })
            if (isMediaType(message.type)) {
              checkIfDeleteFilesFromMedia(message.metadata as MediaSharingMetadata, otherChatEntriesTypeMedia)
            }
            receipts.push({ messageId: associatedMessageId ?? '', state: MessageState.Deleted })
          })

          addAgentActionToQueue({
            type: AgentActionType.SendReceipts,
            parameters: {
              didcommConnectionId: connectionId,
              receipts: receipts.map(item => ({
                messageId: item.messageId,
                state: item.state,
                timestamp: item.timestamp?.getTime(),
              })),
            },
          })
          toast({
            type: 'success',
            message: t('personalChat.messageDeletedSuccessfully', { count: messages.length }),
          })
          resolve()
        } catch (error) {
          logError('Error deleting messages', error)
          toast({ type: 'error', message: t('personalChat.messageUnsuccessfulDeletion') })
          reject(`${error}`)
        }
      })
    },
    [agent, connectionId],
  )

  const reactToMessage = useCallback(
    async (options: { message: ChatEntryMessage; action: 'react' | 'unreact'; emoji: string }) => {
      const { message, action, emoji } = options
      if (!agent || !connectionId) throw new Error('Agent is undefined')
      try {
        const { id: entryId, associatedMessageId } = message

        // Reactions to send to the other party through didcommm
        const didcommReactions = [
          { messageId: associatedMessageId ?? '', action: action as MessageReactionAction, emoji },
        ]

        if (!realm) throw new Error('No active Realm')
        realm.write(() => {
          const object = realm.objectForPrimaryKey(ChatEntry, entryId)
          if (!object) throw new Error(`ChatEntry with id ${entryId} not found`)
          const objectReactions = object.reactions ?? []

          // Find our current reaction to this message
          const reactionIndex = objectReactions.findIndex(item => item.role === ChatEntryRole.Sender)

          // Case 1: add reaction, no previous reaction from our side => just add it
          if (action === 'react' && reactionIndex === -1) {
            objectReactions.push({ emoji, role: ChatEntryRole.Sender })
            // Case 2: add reaction, but there were a previous reaction => remove previous and add this one
          } else if (action === 'react' && reactionIndex !== -1) {
            const myPreviousReaction = objectReactions[reactionIndex]

            didcommReactions.push({
              messageId: associatedMessageId ?? '',
              action: MessageReactionAction.Unreact,
              emoji: myPreviousReaction.emoji,
            })
            objectReactions[reactionIndex] = { emoji, role: ChatEntryRole.Sender }
            // Case 3: remove reaction => remove previous one and notify
          } else if (action === 'unreact' && reactionIndex !== -1) {
            objectReactions.splice(reactionIndex, 1)
            // Case 3: remove reaction but no previous reaction => Do nothing
          } else if (action === 'unreact' && reactionIndex === -1) {
            didcommReactions.splice(0)
          }

          object.reactions = objectReactions
          object.updatedAt = new Date().getTime()
        })

        if (didcommReactions.length) {
          addAgentActionToQueue({
            type: AgentActionType.SendReaction,
            parameters: {
              didcommConnectionId: connectionId,
              didcommReactions,
            },
          })
        }
      } catch (error) {
        logError((error as Error).message)
        toast({ type: 'error', message: t('personalChat.messageUnsuccessfulReaction') })
      }
    },
    [agent, connectionId],
  )

  const onRepliedMessage = useCallback((currentMessage: ChatEntryMessage): RepliedMessage => {
    const dataFromMessage = extractDataFromMessage(currentMessage)
    const { type, thumbnail, chatEntryId, didcommThreadId, userRole: role, preview } = dataFromMessage
    const message = {
      chatEntryId,
      preview,
      didcommThreadId: didcommThreadId ?? '', // FIXME: This should be optional
      role,
      type,
      thumbnail,
    }
    return message
  }, [])

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!agent || !connectionId) throw new Error('Agent is undefined')
      if (!realm) throw new Error('Realm is undefined')
      try {
        if (repliedMessage) onClearRepliedMessageState()

        // Create chat entry
        const chatEntry = createTextChatEntry({
          agent,
          chatThreadId: chatThread.data.id,
          content: text,
          realm,
          role: ChatEntryRole.Sender,
          parentThreadId: repliedMessage?.didcommThreadId,
        })

        // Now add to agent action queue
        addAgentActionToQueue({
          type: AgentActionType.SendTextMessage,
          chatEntryId: chatEntry.id,
          parameters: {
            text,
            didcommThreadId: repliedMessage?.didcommThreadId,
            chatThreadId: chatThread.data.id,
            didcommConnectionId: connectionId,
          },
        })
      } catch (error) {
        log('Error sendTextMessage', error)
      }
    },
    [agent, realm, repliedMessage, chatThread, connectionId],
  )

  const forwardSelectedMessages = useCallback(
    async (connectionIds: string[]) => {
      if (!agent || !realm) return

      for (const id of connectionIds) {
        const connection = await agent.connections.getById(id)
        const thread = findOrCreateChatThread(realm, connection)

        for (const message of selectedMessages) {
          if (message.type === ChatEntryType.TextMessage) {
            const text = (message.metadata as TextMessageMetadata).content

            const chatEntry = createTextChatEntry({
              agent,
              chatThreadId: thread.id,
              content: text,
              realm,
              role: ChatEntryRole.Sender,
            })

            addAgentActionToQueue({
              type: AgentActionType.SendTextMessage,
              chatEntryId: chatEntry.id,
              parameters: {
                text,
                chatThreadId: thread.id,
                didcommConnectionId: connection.id,
              },
            })
          } else if (isMediaType(message.type)) {
            // NOTE: Here we assume that the file is persisted in the remote data store
            // This might not be always true, so a safer approach would be to re-upload
            // the file (probably using different ciphering parameters) and then share
            // with all requested connections. This will be left as a TODO along with other
            // needed refactorings for media sharing.

            const originalRecord = await agent.modules.media.findById(message.associatedRecordId)
            if (!originalRecord || !originalRecord.items) continue
            const item = originalRecord.items[0]

            // Create media record entry
            const newRecord = await agent.modules.media.create({
              connectionId: connection.id,
              items: [item],
              metadata: { ...originalRecord.metadata },
              description: originalRecord.description,
            })
            await agent.modules.media.setMetadata(
              newRecord.id,
              'localFilePath',
              originalRecord.metadata.get('localFilePath') as string,
            )
            await agent.modules.media.setMetadata(
              newRecord.id,
              'localPreviewFilePath',
              originalRecord.metadata.get('localPreviewFilePath') as string,
            )
            if (message.type === ChatEntryType.VoiceNote) {
              await agent.modules.media.setMetadata(
                newRecord.id,
                'waveform',
                originalRecord.metadata.get('waveform') as string,
              )
            }

            // Add share action
            addAgentActionToQueue({
              type: AgentActionType.ShareMedia,
              parameters: {
                recordId: newRecord.id,
              },
            })
          }
        }
      }
      toast({
        type: 'success',
        message: t('personalChat.messageForwarded', { count: selectedMessages.length }),
      })
    },
    [agent, realm, selectedMessages],
  )

  const shareMessages = useCallback(
    async (connectionIds: string[], sharedData: SharedData) => {
      if (!agent || !realm) return
      let excludedLongVideosCount = 0
      for (const message of sharedData.data) {
        const { mimeType } = message
        if (mimeType === 'text/plain') {
          const text = message.data
          for (const id of connectionIds) {
            const connection = await agent.connections.getById(id)
            const thread = findOrCreateChatThread(realm, connection)

            const chatEntry = createTextChatEntry({
              agent,
              chatThreadId: thread.id,
              content: text,
              realm,
              role: ChatEntryRole.Sender,
            })

            addAgentActionToQueue({
              type: AgentActionType.SendTextMessage,
              chatEntryId: chatEntry.id,
              parameters: {
                text,
                chatThreadId: thread.id,
                didcommConnectionId: connection.id,
              },
            })
          }
        } else if (mimeType.startsWith('image') || mimeType.startsWith('video')) {
          let didcommMediaFileSharingData: DidCommMediaFileSharingData | null = await getMediaFileSharingData(
            message.data,
            mimeType,
          )
          const { duration, mime } = didcommMediaFileSharingData
          const isVideo = mime.startsWith('video')
          const isVideoAndExceedsDuration = isVideo && duration && duration > MAX_VIDEO_DURATION
          if (isVideoAndExceedsDuration) {
            excludedLongVideosCount++
          } else {
            if (isVideo) {
              didcommMediaFileSharingData = (await compressVideo(didcommMediaFileSharingData, progress => {
                log('compressing progress', progress)
              })) as DidCommMediaFileSharingData | null
            }
            if (didcommMediaFileSharingData) {
              startMediaUpload({
                didcommConnectionIds: connectionIds,
                didcommMediaFileSharingData,
                deleteOriginalFile: true,
              })
            }
          }
        }
      }
      const toastOptions = getSharedMessagesToastOptions(excludedLongVideosCount, sharedData.data.length, t)
      toast(toastOptions)
    },
    [agent, realm],
  )

  const onActionMenuSelection = useCallback(
    async (selectedItemName: string) => {
      if (!agent || !connectionId) throw new Error('Agent is undefined')
      if (!realm) throw new Error('Realm is undefined')
      try {
        // Create chat entry
        const actionMenuRecord = await agent.modules.actionMenu.findActiveMenu({
          connectionId,
          role: ActionMenuRole.Requester,
        })

        if (actionMenuRecord?.state !== ActionMenuState.PreparingSelection) return
        const chatEntry = createChatEntry(realm, {
          chatThreadId: chatThread.data.id,
          type: ChatEntryType.ActionMenuSelection,
          role: ChatEntryRole.Sender,
          state: ChatEntryState.Created,
          associatedRecordId: actionMenuRecord?.id,
          metadata: { selectedItemName } as ActionMenuSelectionMetadata,
        })

        updateThread(realm, chatThread.data.id, { lastChatEntry: chatEntry })

        // Now add to agent action queue
        addAgentActionToQueue({
          type: AgentActionType.ActionMenuSelection,
          chatEntryId: chatEntry.id,
          parameters: {
            didcommConnectionId: connectionId,
            selectedItemName,
          },
        })
      } catch (error) {
        log('Error onActionMenuSelection', error)
      }
    },
    [agent, realm, repliedMessage, chatThread, connectionId],
  )

  const shareMediaToDidComm = useCallback(
    async (didcommMediaFileSharingData: DidCommMediaFileSharingData) => {
      onClearRepliedMessageState()

      if (!agent || !connectionId) throw new Error('Agent is undefined')

      try {
        // Upload file to Data Store
        await startMediaUpload({
          didcommConnectionIds: [connectionId],
          didcommMediaFileSharingData,
          deleteOriginalFile: true,
        })
      } catch (error) {
        logError(`Error uploading file: ${error}`)
      }
    },
    [agent, connectionId],
  )

  return {
    shareMediaToApp,
    saveFileToGallery,
    reactToMessage,
    onRepliedMessage,
    sendTextMessage,
    onActionMenuSelection,
    shareMediaToDidComm,
    deleteMessagesForMe,
    deleteMessagesForEveryone,
    forwardSelectedMessages,
    shareMessages,
  }
}

const getSharedMessagesToastOptions = (
  excludedLongVideosCount: number,
  messagesSharedCount: number,
  t: (key: string, options?: Record<string, unknown>) => string,
): ToastOptions => {
  if (excludedLongVideosCount === messagesSharedCount) {
    return {
      type: 'error',
      message: t('personalChat.messagesNotShared', { count: messagesSharedCount }),
      duration: 5000,
    }
  }
  if (excludedLongVideosCount) {
    return {
      type: 'warning',
      message: t('personalChat.messagesSharedExcept'),
      duration: 5000,
    }
  }
  return {
    type: 'success',
    message: t('personalChat.messageShared', { count: messagesSharedCount }),
  }
}

function extractDataFromMessage(message: ChatEntryMessage) {
  const chatEntryRecord = message

  const extractedData = {
    type: chatEntryRecord.type,
    filename: '',
    fileType: '',
    mimeType: '',
    items: [],
    preview: getLocalizedPreview(chatEntryRecord),
    entryId: chatEntryRecord.id,
    userRole: chatEntryRecord.role,
    metadata: chatEntryRecord.metadata,
    associatedMessageId: chatEntryRecord.associatedMessageId,
    chatEntryId: chatEntryRecord.id,
    state: chatEntryRecord.state,
    didcommThreadId: chatEntryRecord.didcommThreadId,
    thumbnail: getThumbnail(chatEntryRecord),
    localFilePath: '',
  }

  if (isMediaType(chatEntryRecord.type)) {
    const metadata = chatEntryRecord.metadata as MediaSharingMetadata
    extractedData.filename = metadata.filename!
    extractedData.mimeType = metadata.mimeType!
    extractedData.fileType = metadata.mimeType?.split('/')[0]!
    extractedData.localFilePath = metadata.localFilePath!
  }

  return extractedData
}
