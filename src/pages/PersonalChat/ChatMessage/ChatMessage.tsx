import dayjs from 'dayjs'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BaseSystemMessageView from '../BaseSystemMessageView'
import DateByTimeRangeView from '../DateByTimeRangeView'
import { MessageCustomView } from '../MessageCustomView'
import SystemMessage from '../SystemMessage'
import { chatEntryEqual } from '../utils'

import { ChatEntryType, SystemMessageMetadata } from '@2060/model'
import { MessageProps } from '@2060/pages/PersonalChat/ChatMessage/Props'

const ChatMessage = (props: MessageProps) => {
  const { t } = useTranslation()
  const chatEntry = props.currentMessage

  const renderSystemMessage = () => {
    if (!props.agent) return null
    const metadata = chatEntry.metadata as SystemMessageMetadata
    return <SystemMessage kind={metadata.kind} text={metadata.text} />
  }

  return (
    <View>
      <DateByTimeRangeView currentMessage={props.currentMessage} previousMessage={props.previousMessage} />
      {chatEntry.type === ChatEntryType.System ? (
        renderSystemMessage()
      ) : chatEntry.type === ChatEntryType.ReportMessage ? (
        <BaseSystemMessageView
          text={t('connection.reportedMessage')}
          onPress={() => props.onTouchRepliedMessage(chatEntry.relatedEntryProps?.chatEntryId ?? '')}
        />
      ) : (
        <MessageCustomView {...props} />
      )}
    </View>
  )
}

export default memo(ChatMessage, (prevProps, nextProps) => {
  const currentChatEntry = prevProps.currentMessage
  const nextChatEntry = nextProps.currentMessage
  const currentMessageTime = dayjs(currentChatEntry?.createdAt).format('HH:mm')
  const nextMessageTime = dayjs(nextChatEntry?.createdAt).format('HH:mm')
  const nextMessageHasDifferentTime = currentMessageTime !== nextMessageTime
  const arePropsEqual =
    chatEntryEqual(currentChatEntry, nextChatEntry) &&
    prevProps.nextMessage?.role === nextProps.nextMessage?.role
  const staySame = arePropsEqual && nextMessageHasDifferentTime
  return staySame
})
