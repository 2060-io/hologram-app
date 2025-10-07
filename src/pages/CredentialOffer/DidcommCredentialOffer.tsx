import { AutoAcceptCredential, CredentialState } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { LogBox } from 'react-native'

import BaseCredentialOffer from './BaseCredentialOffer'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useMobileAgent } from '@2060/hooks/agent'
import { useCredentialExchangeForDisplay } from '@2060/hooks/useCredentialExchangeForDisplay'
import { logError } from '@2060/utils'

interface Props extends StackScreenProps<NavigationStackParams, 'DidcommCredentialOffer'> {}

const DidcommCredentialOffer: React.FC<Props> = ({ route, navigation }) => {
  LogBox.ignoreLogs(['Non-serializable values were found in the navigation state'])
  const { credentialRecordId } = route.params
  const { credentialDetails, credentialState } = useCredentialExchangeForDisplay({ credentialRecordId })
  const { agent } = useMobileAgent()
  const enableAcceptRejectButtons = credentialState === CredentialState.OfferReceived

  const accept = () => {
    try {
      // TODO: Move this logic to an AgentAction
      agent?.credentials
        .acceptOffer({
          credentialRecordId,
          autoAcceptCredential: AutoAcceptCredential.ContentApproved,
        })
        .catch(error => logError(`error: ${error}`))
    } catch (error) {
      logError(`Error in accept action: ${error}`)
    }
  }

  const refuse = () => {
    agent?.credentials
      .declineOffer(credentialRecordId, {
        sendProblemReport: true,
        problemReportDescription: 'e.msg.refused',
      })
      .catch(error => logError(`error: ${error}`))
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
