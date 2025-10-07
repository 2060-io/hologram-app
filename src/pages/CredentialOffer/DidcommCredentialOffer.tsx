import { CredentialState } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import BaseCredentialOffer from './BaseCredentialOffer'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType } from '@2060/hooks/agent'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useCredentialExchangeForDisplay } from '@2060/hooks/useCredentialExchangeForDisplay'

interface Props extends StackScreenProps<NavigationStackParams, 'DidcommCredentialOffer'> {}

const DidcommCredentialOffer: React.FC<Props> = ({ route, navigation }) => {
  const { credentialRecordId } = route.params
  const { credentialDetails, credentialState } = useCredentialExchangeForDisplay({ credentialRecordId })
  const { addAgentActionToQueue } = useAgentActionQueue()
  const enableAcceptRejectButtons = credentialState === CredentialState.OfferReceived

  const accept = () => {
    addAgentActionToQueue({
      type: AgentActionType.AcceptCredentialOffer,
      parameters: { credentialRecordId },
    })
  }

  const refuse = () => {
    addAgentActionToQueue({
      type: AgentActionType.DeclineCredentialOffer,
      parameters: { credentialRecordId },
    })
  }

  const onAccept = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.replace('Home')
    accept()
  }

  const onRefuse = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.replace('Home')
    refuse()
  }
  return (
    <>
      {credentialDetails ? (
        <BaseCredentialOffer
          navigation={navigation}
          credentialDetails={credentialDetails}
          accept={onAccept}
          refuse={onRefuse}
          enableAcceptRejectButtons={enableAcceptRejectButtons}
        />
      ) : null}
    </>
  )
}

export default DidcommCredentialOffer
