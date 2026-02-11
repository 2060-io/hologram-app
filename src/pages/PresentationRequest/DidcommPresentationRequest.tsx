import { DidCommProofState } from '@credo-ts/didcomm'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useRef, useCallback, useState, useTransition } from 'react'

import BasePresentationRequest from './BasePresentationRequest'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useFetchServiceInfo } from '@2060/hooks'
import { AgentActionType, useMobileAgent, useAgentActionQueue } from '@2060/hooks/agent'
import {
  DeclineProofRequestParameters,
  ProofSendProblemReportDescription,
  ProofSendProblemReportParameters,
} from '@2060/hooks/agent/actions/types'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryType } from '@2060/model'
import { CredentialMainInfo } from '@2060/services/agent/display'
import {
  FormattedSubmission,
  formatDidcommPresentationSubmission,
} from '@2060/services/agent/formatPresentation'
import { presentProof } from '@2060/services/agent/proofs'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'DidcommPresentationRequest'> {}

const DidcommPresentationRequest: React.FC<Props> = ({ navigation, route }: Props) => {
  const routes = navigation.getState()?.routes
  const prevRoute = routes[routes.length - 2]
  const comesFromChat = prevRoute?.name === 'ChatStack'
  const { realm } = useLocalRealm()
  const { agent } = useMobileAgent()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const selectedCredentials = useRef({})
  const { proofRecordId, did } = route.params
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo(did)
  const [submission, setSubmission] = useState<FormattedSubmission | undefined>(undefined)
  const [isAccepting, startAcceptTransition] = useTransition()

  useFocusEffect(
    useCallback(() => {
      const getFormattedPresentation = async () => {
        if (!agent || !serviceInfo) return
        const newFormattedPresentationRequest = await formatDidcommPresentationSubmission({
          agent,
          proofRecordId,
          verifierInfo: serviceInfo,
        })
        setSubmission(newFormattedPresentationRequest)
      }
      getFormattedPresentation()
    }, [serviceInfo]),
  )

  const accept = async () => {
    if (!agent) return
    startAcceptTransition(async () => {
      try {
        await presentProof({
          agent,
          proofRecordId,
          selectedCredentials: selectedCredentials.current,
        })
        afterPresented()
      } catch (error) {
        toast({ message: `Error ${error}`, type: 'error' })
        logError(`Error presenting credential ${error}`)
      }
    })
  }

  const afterPresented = () => {
    comesFromChat ? navigation.goBack() : goToCredentialPresented()
  }

  const updateChatEntryMetadataIfNecessary = () => {
    if (realm && comesFromChat) {
      const [vpRequestChatEntry] = findAllByAssociatedRecordId(realm, proofRecordId, ChatEntryType.VPRequest)
      if (vpRequestChatEntry) {
        const newMetadata = { ...vpRequestChatEntry.metadata, proofState: DidCommProofState.Declined }
        updateChatEntryMetadata(realm, vpRequestChatEntry.id, newMetadata)
      }
    }
  }

  const refuse = async () => {
    updateChatEntryMetadataIfNecessary()
    const parameters: DeclineProofRequestParameters = { proofRecordId }
    addAgentActionToQueue({
      type: AgentActionType.DeclineProofRequest,
      parameters,
    })
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.replace('Home')
  }

  const notify = () => {
    const parameters: ProofSendProblemReportParameters = {
      proofRecordId,
      description: ProofSendProblemReportDescription.NoCompatibleCredentials,
    }
    addAgentActionToQueue({ type: AgentActionType.ProofSendProblemReport, parameters })
  }

  const goToCredentialPresented = async () => {
    if (!serviceInfo) return
    const selectedCredentialsMainInfo: CredentialMainInfo[] = []
    Object.entries(selectedCredentials.current).map(([entryId, credentialId]) => {
      const currentEntry = submission?.entries.find(entry => entry.id === entryId)
      const credentialSelected = currentEntry?.credentials.find(credential => credential.id === credentialId)
      credentialSelected && selectedCredentialsMainInfo.push(credentialSelected)
    })
    navigation.replace('CredentialPresented', {
      credentials: selectedCredentialsMainInfo,
      verifier: serviceInfo,
    })
  }

  const onSelectCredential = (entryId: string, credentialId: string) => {
    selectedCredentials.current = {
      ...selectedCredentials.current,
      [entryId]: credentialId,
    }
  }

  return submission ? (
    <BasePresentationRequest
      navigation={navigation}
      submission={submission}
      onSelectDidcommCredential={onSelectCredential}
      accept={accept}
      refuse={refuse}
      isFetchingInfo={isFetchingInfo}
      serviceInfo={serviceInfo}
      failedFetchInfo={failedFetchInfo}
      isAccepting={isAccepting}
      notifyNoCompatibleCredentials={notify}
    />
  ) : null
}

export default DidcommPresentationRequest
