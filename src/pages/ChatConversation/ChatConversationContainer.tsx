import { StackScreenProps } from '@react-navigation/stack'
import React, { ElementType } from 'react'

import { ChatConversationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useChatEntries, useChatThreadWithParticipants } from '@2060/hooks/agent'

export interface WrapperChatConversationProps
  extends StackScreenProps<ChatConversationStackParams, 'ChatConversation', 'stack_navigator_main'> {}

const ChatConversationContainer = (ChatConversationComponent: ElementType) => {
  const WrapperChatConversation = (props: WrapperChatConversationProps) => {
    const { chatThreadId, redirectToHomeOnBack } = props.route.params
    const chatThread = useChatThreadWithParticipants(chatThreadId)
    const { chatEntries, loadChatEntries } = useChatEntries(chatThreadId)

    if (!chatThread.data.id || !props.route.params.chatThreadId) return <></>
    return (
      <ChatConversationComponent
        {...props}
        chatEntries={chatEntries}
        loadMoreMessages={loadChatEntries}
        chatThread={chatThread}
        redirectToHomeOnBack={redirectToHomeOnBack}
      />
    )
  }
  return WrapperChatConversation
}

export default ChatConversationContainer
