import { MessageSender } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import BaseForward from './BaseForward'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType, useChats, useMobileAgent } from '@2060/hooks/agent'
import { createChatEntry, updateThread } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { InvitationState } from '@2060/model/InvitationState'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'ForwardConnection'> {}

const ForwardConnection = ({ navigation, route }: Props) => {
  const { t } = useTranslation()
  const { connection } = route.params
  const { agent } = useMobileAgent()
  const messageSender = agent?.context.dependencyManager.resolve(MessageSender)
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { realm } = useLocalRealm()
  const { findOrCreateThread } = useChats()

  const forwardConnection = async (connectionsId: string[]) => {
    if (!agent || !messageSender || !realm) return
    connectionsId.forEach(async connectionId => {
      const didcommConnection = await agent.connections.getById(connectionId)
      const chatThreadId = findOrCreateThread({ connection: didcommConnection }).id
      const metadata = {
        state: InvitationState.AlreadyConnected,
        label: connection.theirLabel,
        imageUrl: connection.imageUrl,
        did: connection.invitationDid,
      }
      // Create chat entry
      const chatEntry = createChatEntry(realm, {
        chatThreadId,
        type: ChatEntryType.Invitation,
        role: ChatEntryRole.Sender,
        state: ChatEntryState.Created,
        metadata,
        createdAt: new Date().getTime(),
        associatedRecordId: '',
      })
      updateThread(realm, chatThreadId, { lastChatEntry: chatEntry })
      addAgentActionToQueue({
        type: AgentActionType.ForwardConnection,
        chatEntryId: chatEntry.id,
        parameters: {
          forwardedConnectionId: connection.id,
          didcommConnectionId: connectionId,
        },
      })
    })
    toast({
      type: 'success',
      message: t('connection.forwarded'),
    })
    navigation.goBack()
  }

  return <BaseForward navigation={navigation} onPressSend={forwardConnection} connectionId={connection.id} />
}

export default ForwardConnection
