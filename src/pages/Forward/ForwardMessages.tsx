import { StackScreenProps } from '@react-navigation/stack'
import { ConnectionsSelection } from '@src/components'
import { ChatStackParams } from '@src/components/Navigation/NavigationProps'
import { useChatActions } from '@src/hooks'
import { useChat } from '@src/hooks/agent'
import React from 'react'

type Props = StackScreenProps<ChatStackParams, 'ForwardMessages'>

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
