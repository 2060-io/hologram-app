import { useFocusEffect } from '@react-navigation/native'
import { useAudioPlayer } from '@simform_solutions/react-native-audio-waveform'
import React, { useState, useRef, useCallback, memo, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View, NativeSyntheticEvent, NativeScrollEvent, ViewToken, FlatList } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { uses24HourClock } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import Realm from 'realm'

import AttachmentOptions from './AttachmentOptions'
import { CustomHeaderProps, ChatEntryMessage } from './ChatMessage/Props'
import ContextualMenu from './ContextualMenu'
import { CustomChatHeader, SelectingMessagesHeader } from './Header'
import InputToolbarView from './InputToolbarView'
import PersonalChatContainer, { WrapperPersonalChatProps } from './PersonalChatContainer'
import ScrollToBottom from './ScrollToBottomView'
import SelectingMessagesBottomMenu from './SelectingMessagesBottomMenu'
import SystemMessage from './SystemMessage'
import { CompressingVideo } from './components'
import getStyles from './styles'
import { getSystemMessage, chatEntryEqual } from './utils'

import { ModalBottomHalf, ModalConfirmAction } from '@2060/components'
import MessageFloatingMenu from '@2060/components/MessageFloatingMenu'
import { Text } from '@2060/components/common'
import { IS_IOS } from '@2060/constants'
import { useAppState, useChatActions } from '@2060/hooks'
import {
  useMobileAgent,
  useChat,
  useActionMenu,
  useChats,
  ChatThreadWithParticipants,
  AgentActionType,
  useConnectionById,
} from '@2060/hooks/agent'
import { RequestUserProfileParameters, SendUserProfileParameters } from '@2060/hooks/agent/actions/types'
import { createChatEntry, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services/ChatEntryService'
import { blockConnection } from '@2060/hooks/agent/connections'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import {
  ChatEntryData,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ChatThreadData,
  SystemMessageMetadata,
} from '@2060/model'
import { ChatMessageList } from '@2060/pages/PersonalChat/ChatMessageList'
import { headerHeight } from '@2060/styles'
import { logWarn } from '@2060/utils'
import { isService, setLastTimeProfileSent, supportsUserProfile } from '@2060/utils/connectionUtils'
import { getFormattedDateRange, isDateGreaterThan, timeFromNow } from '@2060/utils/dateUtils'
import { cancelVideoCompression } from '@2060/utils/mediaFileUtils'
import { markNotificationsOfChatAsViewed } from '@2060/utils/pushNotificationsUtils'
import { toast } from '@2060/utils/toast'

interface PersonalChatProps extends WrapperPersonalChatProps {
  chatEntries: ChatEntryData[]
  loadMoreMessages(): void
  chatThread: ChatThreadWithParticipants
}

const createReportedMessageChatEntry = (params: {
  realm: Realm
  chatThread: ChatThreadData
  messageToReport: ChatEntryMessage
}) => {
  const { realm, chatThread, messageToReport } = params
  createChatEntry(realm, {
    chatThreadId: chatThread.id,
    type: ChatEntryType.ReportMessage,
    role: ChatEntryRole.None,
    state: ChatEntryState.Created,
    associatedRecordId: messageToReport.associatedRecordId,
    relatedEntryProps: {
      chatEntryId: messageToReport.id,
      preview: '',
      didcommThreadId: messageToReport.didcommThreadId ?? '',
      type: messageToReport.type,
      role: messageToReport.role,
    },
  })
  updateChatEntryMetadata(realm, messageToReport.id, {
    ...messageToReport.metadata,
    isReported: true,
  })
}

const PersonalChat = ({ chatEntries, chatThread, navigation, loadMoreMessages }: PersonalChatProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { data: chatThreadData, flags } = chatThread
  const connection = useConnectionById(chatThreadData.connectionId)
  const { isAppActive } = useAppState()
  const { stopPlayersAndExtractors } = useAudioPlayer()
  const { realm } = useLocalRealm()
  const {
    setChatThread,
    displayReportMessageConfirmation,
    setDisplayReportMessageConfirmation,
    selectedMessage,
    modalConfirmMessageDeletion,
    closeModalConfirmMessageDeletion,
    showMessageFloatingMenu,
    closeMessageFloatingMenu,
    showReportMessageConfirmation,
    setRepliedMessage,
    showDeleteMessageConfirmation,
    messageActions,
    isSelectingMessagesMode,
    setIsSelectingMessagesMode,
    stopSelectingMessagesMode,
    selectedMessages,
    updateSelectedMessages,
    tappedRepliedMessageChatEntryId,
    setTappedRepliedMessageChatEntryId,
  } = useChat()
  const { deleteMessagesForMe, deleteMessagesForEveryone, onActionMenuSelection } = useChatActions()
  const { agent } = useMobileAgent()
  const { markThreadAsRead, setActiveChatThreadId } = useChats()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { menu } = useActionMenu({ connectionId: chatThreadData.connectionId })
  const using24HourFormat = uses24HourClock()
  const [currentStickyDate, setCurrentStickyDate] = useState<Date>()
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false)
  const [showStickyDate, setShowStickyDate] = useState(false)
  const [showContextualMenu, setShowContextualMenu] = useState(false)
  const [compressingVideoProgress, setCompressingVideoProgress] = useState(0)
  const showScrollBottomRef = useRef(false)
  const isScrolling = useRef(false)
  const listViewRef = useRef<FlatList<ChatEntryMessage> | null>(null)
  const timerStickyDate = useRef<ReturnType<typeof setTimeout>>(undefined)
  const videoCompressionCancellationId = useRef<string>('')
  const isAlreadyMounted = useRef(false)

  useFocusEffect(
    useCallback(() => {
      setChatThread(chatThread)
      setActiveChatThreadId(chatThread.data.id)
      markThreadAsRead({ id: chatThreadData.id, lastReadAt: new Date() })
      markNotificationsOfChatAsViewed(chatThreadData.connectionId)
      return () => {
        clearTimeout(timerStickyDate.current)
        setActiveChatThreadId(undefined)
      }
    }, []),
  )

  // listener to stop all players and extractors of audios
  // when component unmounts (leaves screen) to free up the maximum possible resources
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      stopPlayersAndExtractors()
    })
    return unsubscribe
  }, [navigation])

  useEffect(() => {
    if (isAppActive) {
      if (isAlreadyMounted.current) {
        setActiveChatThreadId(chatThreadData.id)
        markThreadAsRead({ id: chatThreadData.id, lastReadAt: new Date() })
        markNotificationsOfChatAsViewed(chatThreadData.connectionId)
      }
    } else {
      setActiveChatThreadId(undefined)
    }
  }, [isAppActive])

  useEffect(() => {
    isAlreadyMounted.current = true
  }, [])

  useEffect(() => {
    const checkIfMustSendProfile = () => {
      if (flags.myProfileUpdatedAt && flags.lastTimeProfileSent && agent && connection) {
        const mustSendProfile = isDateGreaterThan(
          flags.myProfileUpdatedAt,
          new Date(flags.lastTimeProfileSent),
        )
        if (mustSendProfile) {
          setLastTimeProfileSent(connection, agent.context)
          const parameters: SendUserProfileParameters = { connectionId: connection.id }
          addAgentActionToQueue({
            type: AgentActionType.SendUserProfile,
            parameters,
          })
        }
      }
    }
    checkIfMustSendProfile()
  }, [])

  useEffect(() => {
    const checkIfMustRequestProfile = () => {
      if (connection && flags.lastTimeProfileReceived) {
        const mustRequestProfile = timeFromNow(flags.lastTimeProfileReceived, 'days') >= 7
        if (mustRequestProfile) {
          const parameters: RequestUserProfileParameters = { connectionId: connection.id }
          addAgentActionToQueue({
            type: AgentActionType.RequestUserProfile,
            parameters,
          })
        }
      }
    }
    if (connection && supportsUserProfile(connection)) checkIfMustRequestProfile()
  }, [])

  const renderSystemMessage = useMemo(() => {
    const systemMessage = getSystemMessage({
      isConnectionBlocked: flags.isConnectionBlocked,
      isConnectionCompleted: flags.isConnectionCompleted,
      isConnectionTerminated: flags.isConnectionTerminated,
      isConnectionDeleted: flags.isConnectionDeleted,
      displayName: chatThreadData.topic,
    })
    if (!systemMessage) return null
    const metadata = systemMessage.metadata as SystemMessageMetadata
    return <SystemMessage kind={metadata.kind} text={metadata.text} />
  }, [chatThread])

  const handleOptionSelectedContextualMenu = (optionName: string) => {
    if (agent && !flags.isConnectionDeleted) {
      setShowContextualMenu(false)
      onActionMenuSelection(optionName)
    }
  }

  const renderCustomHeader = (props: CustomHeaderProps) => {
    const { isConnectionBlocked, isConnectionTerminated, isConnectionDeleted, isConnectionCompleted } = flags
    const canPerformActions =
      !isConnectionBlocked && !isConnectionTerminated && !isConnectionDeleted && isConnectionCompleted
    return (
      <CustomChatHeader
        {...props}
        navigation={navigation}
        chatThread={chatThreadData}
        isTyping={false}
        showMenuIcon={Boolean(menu) && canPerformActions}
        isConnectionDeleted={isConnectionDeleted}
        onShowContextMenu={() => setShowContextualMenu(true)}
        onGoToConnectionDetails={() => {
          if (chatThreadData.connectionId) {
            navigation.navigate('ConnectionDetails', { connectionId: chatThreadData.connectionId })
          }
        }}
      />
    )
  }

  const startSelectingMessagesMode = () => setIsSelectingMessagesMode(true)

  const renderSelectingMessagesHeader = () => (
    <SelectingMessagesHeader navigation={navigation} stopSelectingMessagesMode={stopSelectingMessagesMode} />
  )

  const header = useMemo(() => {
    return isSelectingMessagesMode ? renderSelectingMessagesHeader() : renderCustomHeader({})
  }, [chatThread, menu, isSelectingMessagesMode, flags])

  const scrollToMessage = useCallback(
    (chatEntryId: string) => {
      const dataList = listViewRef.current?.props.data as Array<ChatEntryMessage>
      const messageIndex = dataList.findIndex(value => value.id === chatEntryId)
      setTappedRepliedMessageChatEntryId(chatEntryId)
      if (messageIndex === -1) return loadMoreMessages()
      const mustScrollToIndex =
        listViewRef?.current?.props?.data?.length && listViewRef.current.props.data.length > messageIndex
      if (mustScrollToIndex) {
        listViewRef.current?.scrollToIndex({ animated: true, index: messageIndex, viewPosition: 0.5 })
        setTimeout(() => {
          setTappedRepliedMessageChatEntryId(null)
        }, 1000)
      }
    },
    [listViewRef.current, tappedRepliedMessageChatEntryId],
  )

  const hideReportConfirmation = () => setDisplayReportMessageConfirmation(false)

  const report = async (block?: boolean) => {
    hideReportConfirmation()
    if (!chatThread || !agent || !realm || !selectedMessage || !connection) return
    try {
      const did = isService(connection) ? connection.invitationDid : connection.theirDid
      const { metadata } = selectedMessage
      if (did && metadata) {
        // FIXME: Decide what to do with message reporting, since now we don't have any service related to it
        logWarn('Message reported and no service to handle it')
      }
      createReportedMessageChatEntry({ realm, chatThread: chatThread.data, messageToReport: selectedMessage })
      if (block) await blockConnection(agent, connection)
    } catch (error) {
      toast({ type: 'error', message: `Error reporting message: ${error}` })
    }
  }

  const reportAndBlock = () => report(true)

  const onContentSizeChange = () => {
    if (tappedRepliedMessageChatEntryId) scrollToMessage(tappedRepliedMessageChatEntryId)
  }

  const updateStickyDate = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const lastVisibleItem = viewableItems.at(-1)
    if (lastVisibleItem && lastVisibleItem.item && lastVisibleItem.item.createdAt) {
      setCurrentStickyDate(lastVisibleItem.item.createdAt as Date)
    }
  }, [])

  const onScrollBegin = () => {
    isScrolling.current = true
  }

  const onScrollEnd = () => {
    isScrolling.current = false
    // Hide sticky date 1 second after user stops scrolling
    timerStickyDate.current = setTimeout(() => {
      if (!isScrolling.current) setShowStickyDate(false)
    }, 1000)
  }

  const scrollToBottom = useCallback(() => {
    if (listViewRef && listViewRef.current) {
      listViewRef.current.scrollToOffset({ animated: true, offset: 0 })
    }
  }, [])

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent } = event
    const distanceToTopOfContentList = nativeEvent.contentOffset.y
    const listCurrentFullHeight = nativeEvent.contentSize.height
    const layoutHeight = nativeEvent.layoutMeasurement.height
    const scrollToBottomOffset = 200
    const hiddenContentHeight = listCurrentFullHeight - layoutHeight
    showScrollBottomRef.current = distanceToTopOfContentList > scrollToBottomOffset
    const isAtTheBottomOfList = distanceToTopOfContentList > hiddenContentHeight
    setShowStickyDate(!isAtTheBottomOfList)
  }, [])

  const deleteForMe = () => {
    if (!selectedMessage) return
    closeModalConfirmMessageDeletion()
    deleteMessagesForMe([selectedMessage])
  }

  const deleteForEveryone = () => {
    if (!selectedMessage) return
    closeModalConfirmMessageDeletion()
    deleteMessagesForEveryone([selectedMessage])
  }

  const confirmDeleteForEveryone = () => {
    if (!selectedMessage) return undefined
    const isNotDeleted = selectedMessage.state !== ChatEntryState.Deleted
    const isSender = selectedMessage.role === ChatEntryRole.Sender
    return isNotDeleted && isSender ? t('personalChat.deleteForEveryone') : undefined
  }

  const goToForwardMessages = () => navigation.navigate('ForwardMessages')

  const getVideoCompressionCancellationId = (cancellationId: string) => {
    videoCompressionCancellationId.current = cancellationId
  }

  const cancelCompression = () => {
    cancelVideoCompression(videoCompressionCancellationId.current)
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={IS_IOS ? 'padding' : 'height'} style={styles.subContainer}>
          {header}
          {showStickyDate && (
            <View style={{ ...styles.containerStickyDate, top: headerHeight }}>
              <Text style={styles.stickyDateText}>
                {currentStickyDate && getFormattedDateRange(currentStickyDate)}
              </Text>
            </View>
          )}
          <ChatMessageList
            commonMessageProps={{
              agent,
              supportsMessageReceipts: flags.supportsMessageReceipts,
              using24HourFormat,
              onTouchRepliedMessage: scrollToMessage,
              renderCustomHeader,
              isSelectingMessagesMode,
              selectedMessages,
              updateSelectedMessages,
            }}
            messages={chatEntries}
            listViewProps={{
              ref: listViewRef,
              onStartReached: loadMoreMessages,
              onScrollBeginDrag: onScrollBegin,
              onMomentumScrollBegin: onScrollBegin,
              onScroll,
              onScrollEndDrag: onScrollEnd,
              onMomentumScrollEnd: onScrollEnd,
              onContentSizeChange,
              onViewableItemsChanged: updateStickyDate,
              ListFooterComponent: renderSystemMessage,
            }}
          />
          {flags.isConnectionCompleted &&
            !flags.isConnectionBlocked &&
            !flags.isConnectionTerminated &&
            !isSelectingMessagesMode && (
              <InputToolbarView
                onShowMediaOptions={() => setShowAttachmentOptions(true)}
                showMediaOptions={flags.supportsMediaSharing}
              />
            )}
          {showScrollBottomRef.current && (
            <ScrollToBottom numberNewMessages={0} scrollToBottom={scrollToBottom} />
          )}
          {isSelectingMessagesMode && (
            <SelectingMessagesBottomMenu
              selectedMessages={selectedMessages}
              deleteMessagesForMe={deleteMessagesForMe}
              stopSelectingMessagesMode={stopSelectingMessagesMode}
              deleteMessagesForEveryone={deleteMessagesForEveryone}
              goToForwardMessages={goToForwardMessages}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      {compressingVideoProgress > 0 && (
        <CompressingVideo progress={compressingVideoProgress} cancelCompression={cancelCompression} />
      )}
      <ModalBottomHalf visible={showContextualMenu} onClose={() => setShowContextualMenu(false)}>
        {menu ? (
          <ContextualMenu
            menu={menu}
            connectionIconUrl={flags.connectionIconUrl}
            onSelectOption={handleOptionSelectedContextualMenu}
          />
        ) : null}
      </ModalBottomHalf>
      <ModalBottomHalf visible={showAttachmentOptions} onClose={() => setShowAttachmentOptions(false)}>
        <AttachmentOptions
          closeAttachmentOptions={() => setShowAttachmentOptions(false)}
          onCompressingVideoProgress={setCompressingVideoProgress}
          getVideoCompressionCancellationId={getVideoCompressionCancellationId}
          navigation={navigation}
          connectionId={chatThreadData.connectionId}
        />
      </ModalBottomHalf>
      <MessageFloatingMenu
        navigation={navigation}
        agent={agent}
        showMessageFloatingMenu={showMessageFloatingMenu}
        supportsMessageReceipts={flags.supportsMessageReceipts}
        supportsMessageReactions={flags.supportsMessageReactions}
        using24HourFormat={using24HourFormat}
        messageActions={messageActions.current}
        selectedMessage={selectedMessage}
        closeMessageFloatingMenu={closeMessageFloatingMenu}
        setRepliedMessage={setRepliedMessage}
        showReportMessageConfirmation={showReportMessageConfirmation}
        showDeleteMessageConfirmation={showDeleteMessageConfirmation}
        startSelectingMessagesMode={startSelectingMessagesMode}
        updateSelectedMessages={updateSelectedMessages}
        goToForwardMessages={goToForwardMessages}
      />
      <ModalConfirmAction
        visible={displayReportMessageConfirmation}
        title={t('personalChat.report')}
        subTitle={t('personalChat.reportDetails')}
        confirmText={t('personalChat.report')}
        confirmTextSecondary={t('personalChat.reportAndBlock')}
        cancelText={t('general.cancel')}
        onClose={hideReportConfirmation}
        onConfirm={() => report()}
        onConfirmSecondary={reportAndBlock}
        onCancel={hideReportConfirmation}
      />
      <ModalConfirmAction
        visible={modalConfirmMessageDeletion}
        title={t('personalChat.deleteMessageConfirmation', { count: 1 })}
        confirmText={t('personalChat.deleteForMe')}
        confirmTextSecondary={confirmDeleteForEveryone()}
        cancelText={t('general.cancel')}
        onClose={closeModalConfirmMessageDeletion}
        onConfirm={deleteForMe}
        onConfirmSecondary={deleteForEveryone}
        onCancel={closeModalConfirmMessageDeletion}
      />
    </>
  )
}

const PersonalChatMemo = memo(PersonalChat, (prevProps, nextProps) => {
  return (
    prevProps.chatEntries.length === nextProps.chatEntries.length &&
    prevProps.chatThread.data.connectionId === nextProps.chatThread.data.connectionId &&
    prevProps.chatThread.data.topic === nextProps.chatThread.data.topic &&
    prevProps.chatThread.data.picture === nextProps.chatThread.data.picture &&
    prevProps.chatThread.flags === nextProps.chatThread.flags &&
    prevProps.chatEntries.every(obj1 => nextProps.chatEntries.some(obj2 => chatEntryEqual(obj1, obj2)))
  )
})

export default PersonalChatContainer(PersonalChatMemo)
