import { DidCommMessageSender } from '@credo-ts/didcomm'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { ConnectionsSelection } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { AgentActionType, useAgentActionQueue, useChats, useMobileAgent } from '@src/hooks/agent'
import { ForwardConnectionParameters } from '@src/hooks/agent/actions/types'
import { createChatEntry } from '@src/hooks/agent/chat/services'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@src/model'
import { InvitationState } from '@src/model/InvitationState'
import { toast } from '@src/utils/toast'

type Props = StackScreenProps<NavigationStackParams, 'ForwardConnection'>

const ForwardConnection = ({ navigation, route }: Props) => {
  const { t } = useTranslation()
  const { connection } = route.params
  const { agent } = useMobileAgent()
  const messageSender = agent?.context.dependencyManager.resolve(DidCommMessageSender)
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { realm } = useLocalRealm()
  const { findOrCreateThread } = useChats()

  const forwardConnection = async (connectionsId: string[]) => {
    if (!agent || !messageSender || !realm) return
    connectionsId.forEach(async connectionId => {
      const didcommConnection = await agent.didcomm.connections.getById(connectionId)
      const chatThreadId = findOrCreateThread({ connection: didcommConnection }).id
      const metadata = {
        state: InvitationState.AlreadyConnected,
        label: connection.theirLabel,
        imageUrl: connection.imageUrl,
        did: connection.invitationDid,
      }
      const chatEntry = createChatEntry(realm, {
        chatThreadId,
        type: ChatEntryType.Invitation,
        role: ChatEntryRole.Sender,
        state: ChatEntryState.Created,
        metadata,
        createdAt: new Date().getTime(),
        associatedRecordId: '',
      })
      const parameters: ForwardConnectionParameters = {
        forwarderConnectionId: connection.id,
        connectionId,
      }
      addAgentActionToQueue({
        type: AgentActionType.ForwardConnection,
        chatEntryId: chatEntry.id,
        parameters,
      })
    })
    toast({
      type: 'success',
      message: t('connection.forwarded'),
    })
    navigation.goBack()
  }

  return (
    <ConnectionsSelection
      navigation={navigation}
      onPressSend={forwardConnection}
      connectionIdToExclude={connection.id}
    />
  )
}

export default ForwardConnection
