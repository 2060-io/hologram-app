import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list'
import React, { memo, Ref } from 'react'

import { ChatMessage } from '../ChatMessage'

import { CommonMessageProps, ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'

interface ListViewProps<TMessage> extends FlashListProps<TMessage> {
  ref: Ref<FlashListRef<TMessage>>
}

type ChatMessageListProps = {
  commonMessageProps: CommonMessageProps
  messages: ChatEntryMessage[]
  listViewProps?: Partial<ListViewProps<ChatEntryMessage>>
}

type ItemProps = {
  index: number
  item: ChatEntryMessage
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

export const ChatMessageList = memo((props: ChatMessageListProps) => {
  const { messages, listViewProps } = props
  const keyExtractor = (item: ChatEntryMessage) => `${item.id}`
  const renderListFromBottom = messages.length > 1

  return (
    <FlashList
      keyExtractor={keyExtractor}
      data={messages}
      maintainVisibleContentPosition={{
        startRenderingFromBottom: renderListFromBottom,
        autoscrollToBottomThreshold: 1,
      }}
      renderItem={itemProps => renderItem({ ...itemProps, props })}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onStartReachedThreshold={1}
      showsVerticalScrollIndicator={false}
      {...listViewProps}
    />
  )
})
