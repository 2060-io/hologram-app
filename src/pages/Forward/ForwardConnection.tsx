import { DidCommMessageSender } from '@credo-ts/didcomm'
import { StackScreenProps } from '@react-navigation/stack'
import { ConnectionsSelection } from '@src/components'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { AgentActionType, useAgentActionQueue, useChats, useMobileAgent } from '@src/hooks/agent'
import { ForwardConnectionParameters } from '@src/hooks/agent/actions/types'
import { createChatEntry } from '@src/hooks/agent/chat/services'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@src/model'
import { InvitationState } from '@src/model/InvitationState'
import { canForwardConnection, getConnectionDisplayName } from '@src/utils/connectionUtils'
import { toast } from '@src/utils/toast'
import React from 'react'
import { useTranslation } from 'react-i18next'

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
    const source = await agent.didcomm.connections.getById(connection.id)
    const failedNames: string[] = []
    for (const connectionId of connectionsId) {
      const didcommConnection = await agent.didcomm.connections.getById(connectionId)
      if (!canForwardConnection(source, didcommConnection)) {
        failedNames.push(getConnectionDisplayName(didcommConnection))
        continue
      }
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
    }
    if (failedNames.length > 0) {
      toast({ type: 'error', message: t('connection.notForwarded', { names: failedNames.join(', ') }) })
    } else {
      toast({ type: 'success', message: t('connection.forwarded') })
    }
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
