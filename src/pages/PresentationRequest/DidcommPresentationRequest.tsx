import { DidCommProofState } from '@credo-ts/didcomm'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useRef, useCallback, useState, useTransition } from 'react'

import BasePresentationRequest from './BasePresentationRequest'

import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { useFetchServiceInfo, useScrollSwipeDown } from '@src/hooks'
import { AgentActionType, useMobileAgent, useAgentActionQueue } from '@src/hooks/agent'
import {
  DeclineProofRequestParameters,
  ProofSendProblemReportDescription,
  ProofSendProblemReportParameters,
} from '@src/hooks/agent/actions/types'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@src/hooks/agent/chat/services'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { ChatEntryType } from '@src/model'
import { CredentialMainInfo } from '@src/services/agent/display'
import {
  FormattedSubmission,
  formatDidcommPresentationSubmission,
} from '@src/services/agent/formatPresentation'
import { presentProof } from '@src/services/agent/proofs'
import { logError } from '@src/utils'
import { toast } from '@src/utils/toast'

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
  const { isFetchingInfo, serviceInfo, failedFetchInfo, getServiceInfo } = useFetchServiceInfo(did)
  const { handleScrollBeginDrag, handleScrollEndDrag } = useScrollSwipeDown({
    disabledSwipeDown: isFetchingInfo,
    onSwipeDown: getServiceInfo,
  })
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
      onSelectCredential={onSelectCredential}
      accept={accept}
      refuse={refuse}
      isFetchingInfo={isFetchingInfo}
      serviceInfo={serviceInfo}
      failedFetchInfo={failedFetchInfo}
      isAccepting={isAccepting}
      notifyNoCompatibleCredentials={notify}
      scrollViewProps={{ onScrollBeginDrag: handleScrollBeginDrag, onScrollEndDrag: handleScrollEndDrag }}
    />
  ) : null
}

export default DidcommPresentationRequest
