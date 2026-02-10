import { DidCommCredentialState } from '@credo-ts/didcomm'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import BaseCredentialOffer from './BaseCredentialOffer'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType, useAgentActionQueue, useChats, useMobileAgent } from '@2060/hooks/agent'
import {
  AcceptCredentialOfferParameters,
  DeclineCredentialOfferParameters,
} from '@2060/hooks/agent/actions/types'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useCredentialExchangeForDisplay } from '@2060/hooks/useCredentialExchangeForDisplay'
import { ChatEntryType } from '@2060/model'

interface Props extends StackScreenProps<NavigationStackParams, 'DidcommCredentialOffer'> {}

const DidcommCredentialOffer: React.FC<Props> = ({ route, navigation }) => {
  const { credentialRecordId, did } = route.params
  const { agent } = useMobileAgent()
  const { credentialDetails, credentialState } = useCredentialExchangeForDisplay({ credentialRecordId })
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { realm } = useLocalRealm()
  const { findOrCreateThread } = useChats()
  const enableMainButtons = credentialState === DidCommCredentialState.OfferReceived

  const updateChatEntryMetadataIfNecessary = (newCredentialState: DidCommCredentialState) => {
    if (realm) {
      const [chatEntry] = findAllByAssociatedRecordId(realm, credentialRecordId, ChatEntryType.VCOffer)
      if (chatEntry) {
        const newMetadata = { ...chatEntry.metadata, credentialState: newCredentialState }
        updateChatEntryMetadata(realm, chatEntry.id, newMetadata)
      }
    }
  }

  const goToChatScreen = async (invitationDid: string) => {
    if (!agent) return
    const connections = await agent.didcomm.connections.findByInvitationDid(invitationDid)
    if (connections.length) {
      const [connection] = connections
      const chatThreadId = findOrCreateThread({ connection }).id
      navigation.dispatch(
        StackActions.replace('ChatConversationStack', {
          screen: 'ChatConversation',
          params: { chatThreadId, redirectToHomeOnBack: true },
        }),
      )
    }
  }

  const accept = () => {
    updateChatEntryMetadataIfNecessary(DidCommCredentialState.RequestSent)
    const parameters: AcceptCredentialOfferParameters = { credentialRecordId }
    addAgentActionToQueue({
      type: AgentActionType.AcceptCredentialOffer,
      parameters,
    })
    did ? goToChatScreen(did) : navigation.goBack()
  }

  const refuse = () => {
    updateChatEntryMetadataIfNecessary(DidCommCredentialState.Declined)
    const parameters: DeclineCredentialOfferParameters = { credentialRecordId }
    addAgentActionToQueue({
      type: AgentActionType.DeclineCredentialOffer,
      parameters,
    })
    did ? goToChatScreen(did) : navigation.goBack()
  }

  if (!credentialDetails) return null
  return (
    <BaseCredentialOffer
      navigation={navigation}
      credentialDetails={credentialDetails}
      accept={accept}
      refuse={refuse}
      enableMainButtons={enableMainButtons}
    />
  )
}

export default DidcommCredentialOffer
