import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Keyboard, Vibration } from 'react-native'

import { useScreenLock } from '../providers/ScreenLockProvider'

import { ChatThreadWithParticipants } from './useChatThreads'

import { ChatEntryRole, ChatEntryState, ChatEntryType, RelatedEntryProps, isMediaType } from '@src/model'
import { ChatEntryMessage } from '@src/pages/PersonalChat/ChatMessage/Props'
import { MessageAction } from '@src/pages/PersonalChat/PersonalChatProps'

export type RepliedMessage = RelatedEntryProps

interface PersonalChatState {
  isRecordingVoiceNote: boolean
  repliedMessage?: RepliedMessage
  selectedMessage?: ChatEntryMessage
  chatThread?: ChatThreadWithParticipants
  showMessageFloatingMenu: boolean
  displayReportMessageConfirmation: boolean
  modalConfirmMessageDeletion: boolean
  isSelectingMessagesMode: boolean
  selectedMessages: ChatEntryMessage[]
  tappedRepliedMessageChatEntryId: string | null
}

const getMessageActions = (currentMessage: ChatEntryMessage) => {
  const { type, state } = currentMessage
  const isMedia = isMediaType(type)
  const isText = type === ChatEntryType.TextMessage

  const actionInfoMessage: MessageAction = {
    id: 'action-info',
    icon: 'information-circle',
    label: 'personalChat.info',
  }
  const actionSelectMessage: MessageAction = {
    id: 'action-select',
    icon: 'check-circle-outline',
    label: 'personalChat.select',
    asIcon: 'MaterialCommunityIcons',
  }
  const actionReportMessage: MessageAction = {
    id: 'action-report',
    icon: 'warning-outline',
    label: 'personalChat.report',
  }
  const actionSaveMessage: MessageAction = {
    id: 'action-save',
    icon: 'save-outline',
    label: 'personalChat.save',
  }
  const actionShareMessage: MessageAction = {
    id: 'action-share',
    icon: 'share-outline',
    label: 'personalChat.shareMessage',
  }
  const actionReplyMessage: MessageAction = {
    id: 'action-reply',
    icon: 'arrow-undo-outline',
    label: 'personalChat.reply',
  }
  const actionForwardMessage: MessageAction = {
    id: 'action-forward',
    icon: 'arrow-up-bold-box-outline',
    label: 'personalChat.forward',
    asIcon: 'MaterialCommunityIcons',
  }
  const actionDeleteMessageForMe: MessageAction = {
    id: 'action-delete',
    icon: 'trash-outline',
    label: 'personalChat.delete',
  }
  const actionCopyText: MessageAction = {
    id: 'action-copy',
    icon: 'copy',
    label: 'personalChat.copy',
  }

  const messageActions: MessageAction[] = []

  if (state === ChatEntryState.Deleted) {
    return [actionSelectMessage, actionInfoMessage, actionDeleteMessageForMe]
  }

  if (isMedia || isText) messageActions.push(actionReplyMessage, actionForwardMessage)
  if ([ChatEntryType.Video, ChatEntryType.Image, ChatEntryType.VoiceNote].includes(type)) {
    if (type !== ChatEntryType.VoiceNote) {
      messageActions.push(actionSaveMessage)
    }
    messageActions.push(actionShareMessage)
  }
  const isReported = currentMessage.metadata?.isReported === true

  if (isText) messageActions.push(actionCopyText)

  messageActions.push(actionSelectMessage, actionInfoMessage)
  if (currentMessage.role === ChatEntryRole.Receiver && !isReported) {
    messageActions.push(actionReportMessage)
  }
  messageActions.push(actionDeleteMessageForMe)
  return messageActions
}

interface PersonalChatContextInterface extends PersonalChatState {
  setIsRecordingVoiceNote(isRecording?: boolean): void
  setRepliedMessage(message?: RepliedMessage): void
  setChatThread(chatThread?: ChatThreadWithParticipants): void
  chatThread?: ChatThreadWithParticipants
  displayMessageFloatingMenu(selectedMessage: ChatEntryMessage): void
  displayReportMessageConfirmation: boolean
  setDisplayReportMessageConfirmation(displayReportMessageConfirmation: boolean): void
  modalConfirmMessageDeletion: boolean
  showDeleteMessageConfirmation(): void
  closeModalConfirmMessageDeletion(): void
  closeMessageFloatingMenu(): void
  showReportMessageConfirmation(): void
  messageActions: React.MutableRefObject<MessageAction[]>
  stopSelectingMessagesMode(): void
  setIsSelectingMessagesMode(isSelectingMessagesMode: boolean): void
  updateSelectedMessages(selectedMessage: ChatEntryMessage): void
  setTappedRepliedMessageChatEntryId(id: string | null): void
}

interface Props {
  children: React.ReactNode
}

const PersonalChatStack = createContext<PersonalChatContextInterface | undefined>(undefined)

export const useChat = () => {
  const personalChatContext = useContext(PersonalChatStack)
  if (!personalChatContext) {
    throw new Error('useChat must be used within a PersonalChatContextProvider')
  }

  return personalChatContext
}

export const PersonalChatProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const { forceDisableScreenLock } = useScreenLock()
  const [state, setState] = useState<PersonalChatState>({
    isRecordingVoiceNote: false,
    showMessageFloatingMenu: false,
    displayReportMessageConfirmation: false,
    modalConfirmMessageDeletion: false,
    isSelectingMessagesMode: false,
    selectedMessages: [],
    tappedRepliedMessageChatEntryId: null,
  })
  const messageActions = useRef<MessageAction[]>([])

  const setIsRecordingVoiceNote = useCallback((isRecording: boolean = false) => {
    forceDisableScreenLock(isRecording)
    setState(prevState => ({ ...prevState, isRecordingVoiceNote: isRecording }))
  }, [])

  const setRepliedMessage = useCallback((message?: RepliedMessage) => {
    setState(prevState => ({ ...prevState, repliedMessage: message }))
  }, [])

  const setTappedRepliedMessageChatEntryId = useCallback((id: string | null) => {
    setState(prevState => ({ ...prevState, tappedRepliedMessageChatEntryId: id }))
  }, [])

  const setSelectedMessage = useCallback((selectedMessage: ChatEntryMessage) => {
    setState(prevState => ({ ...prevState, selectedMessage }))
  }, [])

  const resetSelectedMessages = useCallback(() => {
    setState(prevState => ({ ...prevState, selectedMessages: [] }))
  }, [])

  const setIsSelectingMessagesMode = useCallback((isSelectingMessagesMode: boolean) => {
    if (!isSelectingMessagesMode) resetSelectedMessages()
    setState(prevState => ({ ...prevState, isSelectingMessagesMode }))
  }, [])

  const stopSelectingMessagesMode = () => setIsSelectingMessagesMode(false)

  const updateSelectedMessages = useCallback((selectedMessage: ChatEntryMessage) => {
    setState(prevState => {
      const { selectedMessages } = prevState
      const messageIsAlreadySelected = selectedMessages.some(({ id }) => id === selectedMessage.id)
      const newSelectedMessages = messageIsAlreadySelected
        ? selectedMessages.filter(chatEntry => chatEntry.id !== selectedMessage.id)
        : [...selectedMessages, selectedMessage]
      return { ...prevState, selectedMessages: newSelectedMessages }
    })
  }, [])

  const setChatThread = useCallback((chatThread: ChatThreadWithParticipants) => {
    setState(prevState => ({ ...prevState, chatThread }))
  }, [])

  const setShowMessageFloatingMenu = useCallback((showMessageFloatingMenu: boolean) => {
    setState(prevState => ({ ...prevState, showMessageFloatingMenu }))
  }, [])

  const setDisplayReportMessageConfirmation = useCallback((displayReportMessageConfirmation: boolean) => {
    setState(prevState => ({ ...prevState, displayReportMessageConfirmation }))
  }, [])

  const setModalConfirmMessageDeletion = useCallback((modalConfirmMessageDeletion: boolean) => {
    setState(prevState => ({ ...prevState, modalConfirmMessageDeletion }))
  }, [])

  const closeMessageFloatingMenu = useCallback(() => {
    setShowMessageFloatingMenu(false)
  }, [])

  const showReportMessageConfirmation = useCallback(() => {
    setDisplayReportMessageConfirmation(true)
  }, [])

  const displayMessageFloatingMenu = (selectedMessage: ChatEntryMessage) => {
    if (Keyboard.isVisible()) Keyboard.dismiss()
    Vibration.vibrate(50, false)
    setSelectedMessage(selectedMessage)
    const actions = getMessageActions(selectedMessage)
    messageActions.current = actions
    setShowMessageFloatingMenu(true)
  }

  const showDeleteMessageConfirmation = () => setModalConfirmMessageDeletion(true)
  const closeModalConfirmMessageDeletion = () => setModalConfirmMessageDeletion(false)

  return (
    <PersonalChatStack
      value={{
        ...state,
        setIsRecordingVoiceNote,
        setRepliedMessage,
        setChatThread,
        messageActions,
        displayMessageFloatingMenu,
        setDisplayReportMessageConfirmation,
        showDeleteMessageConfirmation,
        closeModalConfirmMessageDeletion,
        closeMessageFloatingMenu,
        showReportMessageConfirmation,
        setIsSelectingMessagesMode,
        stopSelectingMessagesMode,
        updateSelectedMessages,
        setTappedRepliedMessageChatEntryId,
      }}
    >
      {children}
    </PersonalChatStack>
  )
}
