import { CommonMessageProps, ChatEntryMessage } from '@2060/pages/PersonalChat/ChatMessage/Props'
import { FlashList, FlashListProps } from '@shopify/flash-list'
import React, { useState, useRef, memo } from 'react'
import { View, Keyboard, TouchableWithoutFeedback, LayoutChangeEvent } from 'react-native'

import { ChatMessage } from '../ChatMessage'

import styles from './styles'

interface ListViewProps<TMessage> extends FlashListProps<TMessage> {
  ref: React.MutableRefObject<FlashList<TMessage> | null>
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
  const keyExtractor = (item: ChatEntryMessage) => `${item.id}`
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const containerHeight = useRef(0)
  const listHeight = useRef(0)

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
          data={props.messages}
          maintainVisibleContentPosition={{
            startRenderingFromBottom: true,
            autoscrollToBottomThreshold: 1,
          }}
          renderItem={itemProps => renderItem({ ...itemProps, props })}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          onLayout={onListLayout}
          {...props.listViewProps}
        />
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.contentContainerStyle} />
      </TouchableWithoutFeedback>
    </View>
  )
})
