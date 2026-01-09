import { StackScreenProps } from '@react-navigation/stack'
import React, { ElementType } from 'react'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { useChatEntries, useChatThreadWithParticipants } from '@2060/hooks/agent'

export interface WrapperPersonalChatProps
  extends StackScreenProps<PersonalChatStackParams, 'PersonalChat', 'stack_navigator_main'> {}

const PersonalChatContainer = (PersonalChatComponent: ElementType) => {
  const WrapperPersonalChat = (props: WrapperPersonalChatProps) => {
    const { chatThreadId } = props.route.params
    const chatThread = useChatThreadWithParticipants(chatThreadId)
    const { chatEntries, loadChatEntries } = useChatEntries(chatThreadId)

    if (!chatThread.data.id || !props.route.params.chatThreadId) return <></>
    return (
      <PersonalChatComponent
        {...props}
        chatEntries={chatEntries}
        loadMoreMessages={loadChatEntries}
        chatThread={chatThread}
      />
    )
  }
  return WrapperPersonalChat
}

export default PersonalChatContainer
