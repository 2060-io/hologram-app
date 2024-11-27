import dayjs from 'dayjs'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ViewStyle } from 'react-native'

import CallOfferChatView from '../CallOfferChatView'
import DeletedMessageView from '../DeletedMessageView'
import EMrtdReadRequestChatView from '../EMrtdReadRequestChatView'
import HtmlChatView from '../HtmlChatView'
import ImageChatView from '../ImageChatView'
import InvitationChatView from '../InvitationChatView'
import MessageTextView from '../MessageTextView'
import MrzRequestChatView from '../MrzRequestChatView'
import QuestionChatView from '../QuestionChatView'
import RepliedMessageView from '../RepliedMessageView'
import TicksView from '../TicksView'
import UserActionChatView from '../UserActionChatView'
import VCOfferChatView from '../VCOfferChatView '
import VPChatView from '../VPChatView'
import VPRequestChatView from '../VPRequestChatView'
import VideoChatView from '../VideoChatView'
import VoiceNoteChatView from '../VoiceNoteChatView'

import Reactions from './Reactions'
import getStyles from './styles'
import { mustDisplayAckAndTime } from './utils'

import { Text } from '@2060/components/common'
import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import {
  CallOfferMetadata,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  EMrtdReadRequestMetadata,
  InvitationMetadata,
  LinkMetadata,
  MediaSharingMetadata,
  MrzRequestMetadata,
  QuestionMetadata,
  TextMessageMetadata,
  VCOfferMetadata,
  VPRequestMetadata,
} from '@2060/model'
import { BaseCustomMessageViewProps } from '@2060/pages/PersonalChat/ChatMessage/Props'

const BaseCustomView: React.FC<BaseCustomMessageViewProps> = memo(props => {
  const {
    onTouchRepliedMessage,
    supportsMessageReceipts,
    currentMessage,
    agent,
    renderCustomHeader,
    using24HourFormat,
    nextMessage,
    borders,
  } = props
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const chatEntry = currentMessage
  const timeFormat = using24HourFormat ? 'HH:mm' : 'h:mm a'
  const nextMessageChatEntry = nextMessage
  const relatedEntryProps = chatEntry.relatedEntryProps
  const { chatThread } = useChat()
  const user = chatThread?.participants.find(p => p.id === chatEntry.role)
  const messageTime = dayjs(new Date(currentMessage?.createdAt)).format(timeFormat)
  const displayTimeAndTicks = mustDisplayAckAndTime({
    messageTime,
    chatEntry,
    nextMessageChatEntry,
    timeFormat,
  })
  const hasRelatedMessage = relatedEntryProps ? Boolean(Object.keys(relatedEntryProps).length) : false
  const repliedMessage = relatedEntryProps

  const renderMessageByType = useMemo(() => {
    const renderComponentByType = (messageType: ChatEntryType): React.JSX.Element => {
      switch (messageType) {
        case ChatEntryType.Question:
          return (
            <QuestionChatView
              question={chatEntry.metadata as QuestionMetadata}
              associatedRecordId={chatEntry.associatedRecordId}
            />
          )
        case ChatEntryType.Answer:
          return (
            <UserActionChatView
              message={chatEntry.metadata?.response as string}
              title={t('personalChat.response')}
              iconName="question"
            />
          )
        case ChatEntryType.ActionMenuSelection:
          return (
            <UserActionChatView
              message={(chatEntry.metadata?.selectedItemName as string) ?? ''}
              title={t('personalChat.menuActionSelected')}
              iconName="menuOutline"
            />
          )
        case ChatEntryType.Image:
          return (
            <ImageChatView
              {...{
                mediaRecordId: chatEntry.associatedRecordId,
                mediaItem: chatEntry.metadata as MediaSharingMetadata,
                fileMediaInfo: {
                  user,
                  createdAt: new Date(chatEntry.createdAt),
                },
                currentMessage,
              }}
            />
          )
        case ChatEntryType.Video:
          return (
            <VideoChatView
              {...{
                mediaRecordId: chatEntry.associatedRecordId,
                mediaItem: chatEntry.metadata as MediaSharingMetadata,
                fileMediaInfo: {
                  user,
                  createdAt: new Date(chatEntry.createdAt),
                },
                currentMessage,
              }}
            />
          )
        case ChatEntryType.Link:
          return (
            <HtmlChatView
              {...{
                ...chatEntry,
                metadata: chatEntry.metadata as LinkMetadata,
                renderCustomHeader,
              }}
            />
          )
        case ChatEntryType.VPRequest:
          return (
            <VPRequestChatView
              proofRecordId={chatEntry.associatedRecordId}
              metadata={chatEntry.metadata as VPRequestMetadata}
              agent={agent}
              sender={user}
            />
          )
        case ChatEntryType.VPResponse:
          return (
            <VPChatView
              presentedCredentials={chatEntry.metadata?.presentedCredentials as string}
              role={chatEntry.role}
              verifierName={chatThread?.participants.find(p => p.id === ChatEntryRole.Receiver)?.name}
            />
          )
        case ChatEntryType.VCOffer:
          return (
            <VCOfferChatView
              associatedRecordId={chatEntry.associatedRecordId}
              metadata={chatEntry.metadata as VCOfferMetadata}
              agent={agent}
              sender={user}
            />
          )
        case ChatEntryType.Invitation:
          return (
            <InvitationChatView
              associatedRecordId={chatEntry.associatedRecordId}
              metadata={chatEntry.metadata as InvitationMetadata}
              agent={agent}
            />
          )
        case ChatEntryType.CallOffer:
          return (
            <CallOfferChatView
              metadata={chatEntry.metadata as CallOfferMetadata}
              sender={user}
              didcommThreadId={chatEntry.didcommThreadId as string}
            />
          )
        case ChatEntryType.MrzRequest:
          return (
            <MrzRequestChatView
              didcommThreadId={chatEntry.didcommThreadId as string}
              metadata={chatEntry.metadata as MrzRequestMetadata}
            />
          )
        case ChatEntryType.EMrtdReadRequest:
          return (
            <EMrtdReadRequestChatView
              didcommThreadId={chatEntry.didcommThreadId}
              metadata={chatEntry.metadata as EMrtdReadRequestMetadata}
            />
          )
        default:
          return <></>
      }
    }
    const Component = renderComponentByType(chatEntry.type)
    return Component
  }, [chatEntry, chatThread])

  const renderTimeAndTicks = useCallback(
    (containerStyle: ViewStyle) => {
      return (
        displayTimeAndTicks && (
          <View style={containerStyle}>
            <Text typography="EuclidCircularA-Regular" style={styles.timeText}>
              {messageTime}
            </Text>
            {supportsMessageReceipts ? (
              <TicksView role={currentMessage.role} state={currentMessage.state} />
            ) : null}
          </View>
        )
      )
    },
    [displayTimeAndTicks, messageTime, currentMessage, theme],
  )

  const renderMessage = useMemo(() => {
    if (chatEntry.type === ChatEntryType.TextMessage) {
      return (
        <MessageTextView
          text={(chatEntry.metadata as TextMessageMetadata).content}
          renderTimeAndTicks={renderTimeAndTicks}
        />
      )
    }
    if (chatEntry.type === ChatEntryType.VoiceNote) {
      return (
        <VoiceNoteChatView
          mediaRecordId={chatEntry.associatedRecordId}
          mediaItem={chatEntry.metadata as MediaSharingMetadata}
          renderTimeAndTicks={renderTimeAndTicks}
          role={currentMessage.role}
        />
      )
    }
    return (
      <>
        {renderMessageByType}
        {renderTimeAndTicks(styles.containerAckAndTime)}
      </>
    )
  }, [chatEntry, theme])

  return (
    <View>
      {chatEntry.state === ChatEntryState.Deleted ? (
        <DeletedMessageView displayTimeAndTicks={displayTimeAndTicks} messageTime={messageTime} />
      ) : (
        <>
          {hasRelatedMessage && repliedMessage && (
            <TouchableOpacity onPress={() => onTouchRepliedMessage(relatedEntryProps?.chatEntryId ?? '')}>
              <RepliedMessageView
                isInputToolbarView={false}
                repliedMessage={repliedMessage}
                style={{
                  borderTopLeftRadius: borders.borderTopLeftRadius,
                  borderTopRightRadius: borders.borderTopRightRadius,
                }}
              />
            </TouchableOpacity>
          )}
          {renderMessage}
          {!!chatEntry.reactions.length && (
            <Reactions role={chatEntry.role} reactions={chatEntry.reactions} />
          )}
        </>
      )}
    </View>
  )
})

export default BaseCustomView
