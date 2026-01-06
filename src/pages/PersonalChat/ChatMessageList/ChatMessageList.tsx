import React, { memo, Ref } from 'react'
import { FlatList, FlatListProps, StyleSheet } from 'react-native'

import { ChatMessage } from '../ChatMessage'

import { CommonMessageProps, ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'

type ListViewProps<TMessage> = FlatListProps<TMessage> & {
  ref?: Ref<FlatList<TMessage>>
}

type ChatMessageListProps = {
  commonMessageProps: CommonMessageProps
  messages: ChatEntryMessage[]
  listViewProps?: Partial<ListViewProps<ChatEntryMessage>>
}

type ItemProps = {
  item: ChatEntryMessage
  previousMessage?: ChatEntryMessage
  nextMessage?: ChatEntryMessage
  commonMessageProps: CommonMessageProps
}

const renderItem = ({ item, previousMessage, nextMessage, commonMessageProps }: ItemProps) => {
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
  const { messages, listViewProps, commonMessageProps } = props
  return (
    <FlatList
      data={messages}
      inverted
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) =>
        renderItem({
          item,
          previousMessage: messages[index + 1],
          nextMessage: messages[index - 1],
          commonMessageProps,
        })
      }
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      initialNumToRender={20}
      {...listViewProps}
    />
  )
})

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
})
