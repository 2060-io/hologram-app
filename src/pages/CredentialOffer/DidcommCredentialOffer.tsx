import { CredentialState } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import BaseCredentialOffer from './BaseCredentialOffer'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType } from '@2060/hooks/agent'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useCredentialExchangeForDisplay } from '@2060/hooks/useCredentialExchangeForDisplay'
import { ChatEntryType } from '@2060/model'

interface Props extends StackScreenProps<NavigationStackParams, 'DidcommCredentialOffer'> {}

const DidcommCredentialOffer: React.FC<Props> = ({ route, navigation }) => {
  const routes = navigation.getState()?.routes
  const prevRoute = routes[routes.length - 2]
  const comesFromChat = prevRoute.name === 'PersonalChatStack'
  const { credentialRecordId } = route.params
  const { credentialDetails, credentialState } = useCredentialExchangeForDisplay({ credentialRecordId })
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { realm } = useLocalRealm()
  const enableAcceptRejectButtons = credentialState === CredentialState.OfferReceived

  const updateChatEntryMetadataIfNecessary = (newCredentialState: CredentialState) => {
    if (realm && comesFromChat) {
      const [chatEntry] = findAllByAssociatedRecordId(realm, credentialRecordId, ChatEntryType.VCOffer)
      if (chatEntry) {
        const newMetadata = { ...chatEntry.metadata, credentialState: newCredentialState }
        updateChatEntryMetadata(realm, chatEntry.id, newMetadata)
      }
    }
  }

  const accept = () => {
    updateChatEntryMetadataIfNecessary(CredentialState.RequestSent)
    addAgentActionToQueue({
      type: AgentActionType.AcceptCredentialOffer,
      parameters: { credentialRecordId },
    })
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.replace('Home')
  }

  const refuse = () => {
    updateChatEntryMetadataIfNecessary(CredentialState.Declined)
    addAgentActionToQueue({
      type: AgentActionType.DeclineCredentialOffer,
      parameters: { credentialRecordId },
    })
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.replace('Home')
  }

  return (
    <>
      {credentialDetails ? (
        <BaseCredentialOffer
          navigation={navigation}
          credentialDetails={credentialDetails}
          accept={accept}
          refuse={refuse}
          enableAcceptRejectButtons={enableAcceptRejectButtons}
        />
      ) : null}
    </>
  )
}

export default DidcommCredentialOffer
