import React, { memo, Ref } from 'react'
import { FlatList, FlatListProps, StyleSheet } from 'react-native'

import { ChatMessage } from '../ChatMessage'

import { CommonMessageProps, ChatEntryMessage } from '@src/pages/PersonalChat/ChatMessage/Props'

type ListViewProps<TMessage> = FlatListProps<TMessage> & {
  ref?: Ref<FlatList<TMessage>>
}

type ChatMessageListProps = {
  commonMessageProps: CommonMessageProps
  messages: ChatEntryMessage[]
  listViewProps?: Partial<ListViewProps<ChatEntryMessage>>
}

type ItemProps = {
  currentMessage: ChatEntryMessage
  previousMessage?: ChatEntryMessage
  nextMessage?: ChatEntryMessage
  commonMessageProps: CommonMessageProps
}

const renderItem = ({ currentMessage, previousMessage, nextMessage, commonMessageProps }: ItemProps) => {
  const messageProps = {
    ...commonMessageProps,
    currentMessage,
    previousMessage,
    nextMessage,
  }
  return <ChatMessage key={currentMessage.id} {...messageProps} />
}

export const ChatMessageList = memo((props: ChatMessageListProps) => {
  const { messages, listViewProps, commonMessageProps } = props
  return (
    <FlatList
      data={messages}
      inverted
      keyExtractor={item => item.id}
      renderItem={({ item: currentMessage, index }) =>
        renderItem({
          currentMessage,
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
      alwaysBounceVertical={false}
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
