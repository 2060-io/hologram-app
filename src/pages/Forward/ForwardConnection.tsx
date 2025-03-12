import { MessageSender, OutboundMessageContext, OutOfBandInvitation } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import BaseForward from './BaseForward'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useMobileAgent } from '@2060/hooks/agent'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'ForwardConnection'> {}

const ForwardConnection = ({ navigation, route }: Props) => {
  const { t } = useTranslation()
  const { connection } = route.params
  const { agent } = useMobileAgent()
  const messageSender = agent?.context.dependencyManager.resolve(MessageSender)

  const forwardConnection = async (connectionsId: string[]) => {
    if (!agent || !messageSender) return
    connectionsId.forEach(async connectionId => {
      const connectionToSendInvitation = await agent.connections.getById(connectionId)
      const json = {
        '@type': OutOfBandInvitation.type.messageTypeUri,
        '@id': connection.invitationDid,
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
