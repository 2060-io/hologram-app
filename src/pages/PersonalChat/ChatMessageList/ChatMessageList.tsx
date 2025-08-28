import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list'
import React, { useState, useRef, memo, Ref } from 'react'
import { View, Keyboard, TouchableWithoutFeedback, LayoutChangeEvent } from 'react-native'

import { ChatMessage } from '../ChatMessage'

import styles from './styles'

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
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const containerHeight = useRef(0)
  const listHeight = useRef(0)
  const renderListFromBottom = scrollEnabled && messages.length > 1

  const checkIfScrollIsEnabled = () => {
    const scrollIsEnabled = listHeight.current >= containerHeight.current
    setScrollEnabled(scrollIsEnabled)
  }

  const onContainerLayout = (event: LayoutChangeEvent) => {
    containerHeight.current = event.nativeEvent.layout.height
    checkIfScrollIsEnabled()
  }

  const onListLayout = (event: LayoutChangeEvent) => {
    listHeight.current = event.nativeEvent.layout.height
    checkIfScrollIsEnabled()
  }

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <View style={styles.containerAlignTop}>
        <FlashList
          keyExtractor={keyExtractor}
          data={messages}
          maintainVisibleContentPosition={{
            startRenderingFromBottom: renderListFromBottom,
            autoscrollToBottomThreshold: 1,
          }}
          renderItem={itemProps => renderItem({ ...itemProps, props })}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          onLayout={onListLayout}
          {...listViewProps}
        />
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainerStyle} />
      </TouchableWithoutFeedback>
    </View>
  )
})
