import { LegendList, LegendListProps, LegendListRef, LegendListRenderItemProps } from '@legendapp/list'
import React, { memo, Ref } from 'react'

import { ChatMessage } from '../ChatMessage'

import { ChatEntryData } from '@2060/model'
import { CommonMessageProps, ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'

type ListViewProps<TMessage> = LegendListProps<TMessage> & {
  ref: Ref<LegendListRef>
}

type ChatMessageListProps = {
  commonMessageProps: CommonMessageProps
  messages: ChatEntryMessage[]
  listViewProps?: Partial<Omit<ListViewProps<ChatEntryMessage>, 'children'>>
}

type ItemProps = LegendListRenderItemProps<ChatEntryData> & {
  props: ChatMessageListProps
}

const renderItem = ({ item, index, props }: ItemProps) => {
  const { messages, commonMessageProps } = props
  const previousMessage = messages[index - 1]
  const nextMessage = messages[index + 1]
  const messageProps = {
    ...commonMessageProps,
    currentMessage: item,
    previousMessage,
    nextMessage,
  }
  return <ChatMessage key={item.id} {...messageProps} />
}
const keyExtractor = (item: ChatEntryMessage) => `${item.id}`

export const ChatMessageList = memo((props: ChatMessageListProps) => {
  const { messages, listViewProps } = props
  return (
    <LegendList
      keyExtractor={keyExtractor}
      data={messages}
      renderItem={itemProps => renderItem({ ...itemProps, props })}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      alignItemsAtEnd
      maintainScrollAtEnd
      maintainScrollAtEndThreshold={1}
      initialScrollIndex={messages.length - 1}
      {...listViewProps}
    />
  )
})
