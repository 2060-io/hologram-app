import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import { ConnectionsSelection } from '@src/components'
import { PersonalChatStackParams } from '@src/components/Navigation/NavigationProps'
import { useChatActions } from '@src/hooks'
import { useChat } from '@src/hooks/agent'

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
    <ConnectionsSelection
      navigation={navigation}
      onPressSend={forwardMessages}
      connectionIdToExclude={chatThread?.data.connectionId}
    />
  )
}

export default ForwardMessages
