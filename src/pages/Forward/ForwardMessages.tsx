import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import BaseForward from './BaseForward'

import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { useChatActions } from '@2060/hooks'
import { useChat } from '@2060/hooks/agent'

interface Props extends StackScreenProps<PersonalChatStackParams, 'ForwardMessages'> {}

const ForwardMessages = ({ navigation }: Props) => {
  const { forwardSelectedMessages } = useChatActions()
  const { stopSelectingMessagesMode, chatThread } = useChat()

  const forwardMessages = (connectionsId: string[]) => {
    forwardSelectedMessages(connectionsId)
    stopSelectingMessagesMode()
    navigation.goBack()
  }

  return (
    <BaseForward
      navigation={navigation}
      onPressForward={forwardMessages}
      connectionId={chatThread?.data.connectionId}
    />
  )
}

export default ForwardMessages
