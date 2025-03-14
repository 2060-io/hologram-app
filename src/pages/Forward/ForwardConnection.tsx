import { MessageSender, OutboundMessageContext, OutOfBandInvitation, utils } from '@credo-ts/core'
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
      // send invitation
      const connectionToSendInvitation = await agent.connections.getById(connectionId)
      const json = {
        '@type': OutOfBandInvitation.type.messageTypeUri,
        '@id': utils.uuid(),
        label: connection.theirLabel,
        imageUrl: connection.imageUrl,
        services: [connection.invitationDid],
        handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
      }
      const invitation = OutOfBandInvitation.fromJson(json)
      messageSender.sendMessage(
        new OutboundMessageContext(invitation, {
          agentContext: agent.context,
          connection: connectionToSendInvitation,
        }),
      )
      // Create chat entry
      const metadata = {
        state: InvitationState.AlreadyConnected,
        label: connection.theirLabel,
        imageUrl: connection.imageUrl,
        did: connection.invitationDid,
      }
      const chatThreadId = findOrCreateThread({ connection: connectionToSendInvitation }).id
      const chatEntry = createChatEntry(realm, {
        chatThreadId,
        type: ChatEntryType.Invitation,
        role: ChatEntryRole.Sender,
        state: ChatEntryState.Created,
        metadata,
        createdAt: new Date().getTime(),
        // Fixme: this is wrong needs correct associatedRecordId or
        // make associatedRecordId optional and do not send it
        associatedRecordId: utils.uuid(),
      })
      updateThread(realm, chatThreadId, { lastChatEntry: chatEntry })
      addAgentActionToQueue({
        type: AgentActionType.SendInvitation,
        chatEntryId: chatEntry.id,
        parameters: {
          invitation,
          connectionToSendInvitation,
        },
      })
    })
    toast({
      type: 'success',
      message: t('connection.forwarded'),
    })
    navigation.goBack()
  }

  return (
    <BaseForward navigation={navigation} onPressForward={forwardConnection} connectionId={connection.id} />
  )
}

export default ForwardConnection
