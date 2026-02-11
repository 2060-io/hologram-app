import { StackScreenProps } from '@react-navigation/stack'
import React, { ElementType } from 'react'

import { ChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { useChatEntries, useChatThreadWithParticipants } from '@2060/hooks/agent'

export interface WrapperChatProps extends StackScreenProps<ChatStackParams, 'Chat', 'stack_navigator_main'> {}

const ChatContainer = (ChatComponent: ElementType) => {
  const WrapperChat = (props: WrapperChatProps) => {
    const { chatThreadId, redirectToHomeOnBack } = props.route.params
    const chatThread = useChatThreadWithParticipants(chatThreadId)
    const { chatEntries, loadChatEntries } = useChatEntries(chatThreadId)

    if (!chatThread.data.id || !props.route.params.chatThreadId) return <></>
    return (
      <ChatComponent
        {...props}
        chatEntries={chatEntries}
        loadMoreMessages={loadChatEntries}
        chatThread={chatThread}
        redirectToHomeOnBack={redirectToHomeOnBack}
      />
    )
  }
  return WrapperChat
}

export default ChatContainer
