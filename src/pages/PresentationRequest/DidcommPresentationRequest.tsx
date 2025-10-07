import { ProofState } from '@credo-ts/core'
import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useRef, useCallback, useState, useTransition } from 'react'
import { LogBox } from 'react-native'

import BasePresentationRequest from './BasePresentationRequest'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useFetchServiceInfo } from '@2060/hooks'
import { useMobileAgent } from '@2060/hooks/agent'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryType } from '@2060/model'
import { CredentialMainInfo } from '@2060/services/agent/display'
import {
  FormattedSubmission,
  formatDidcommPresentationSubmission,
} from '@2060/services/agent/formatPresentation'
import { notifyNoCompatibleCredentials, presentProof } from '@2060/services/agent/proofs'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'DidcommPresentationRequest'> {}

const DidcommPresentationRequest: React.FC<Props> = ({ navigation, route }: Props) => {
  LogBox.ignoreLogs(['Non-serializable values were found in the navigation state'])
  const routes = navigation.getState()?.routes
  const prevRoute = routes[routes.length - 2]
  const comesFromChat = prevRoute.name === 'PersonalChatStack'
  const { realm } = useLocalRealm()
  const { agent } = useMobileAgent()
  const selectedCredentials = useRef({})
  const { proofRecordId, did } = route.params
  const { serviceInfo } = useFetchServiceInfo(did, true)
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

  const onSelectCredential = (entryId: string, credentialId: string) => {
    selectedCredentials.current = {
      ...selectedCredentials.current,
      [entryId]: credentialId,
    }
  }

  // TODO: Move to an AgentAction
  const refuse = async () => {
    agent?.proofs.declineRequest({ proofRecordId, sendProblemReport: true })
    if (realm && comesFromChat) {
      const [vpRequestChatEntry] = findAllByAssociatedRecordId(realm, proofRecordId, ChatEntryType.VPRequest)
      if (vpRequestChatEntry) {
        const newMetadata = { ...vpRequestChatEntry.metadata, proofState: ProofState.Declined }
        updateChatEntryMetadata(realm, vpRequestChatEntry.id, newMetadata)
      }
    }
  }

  const onRefuse = () => {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.replace('Home')
    refuse()
  }

  const onAccept = async () => {
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

  const notify = () => {
    if (!agent) return
    notifyNoCompatibleCredentials({ agent, proofRecordId })
  }

  const afterPresented = () => {
    comesFromChat ? navigation.goBack() : goToCredentialPresented()
  }

  const goToCredentialPresented = async () => {
    if (!serviceInfo) return
    const presentedAt = new Date()
    const selectedCredentialsMainInfo: CredentialMainInfo[] = []
    Object.entries(selectedCredentials.current).map(([entryId, credentialId]) => {
      const currentEntry = submission?.entries.find(entry => entry.id === entryId)
      const credentialSelected = currentEntry?.credentials.find(credential => credential.id === credentialId)
      credentialSelected && selectedCredentialsMainInfo.push(credentialSelected)
    })
    navigation.replace('CredentialPresented', {
      credentials: selectedCredentialsMainInfo,
      verifier: serviceInfo,
      presentedAt: presentedAt.toString(),
    })
  }

  return submission ? (
    <BasePresentationRequest
      navigation={navigation}
      submission={submission}
      onSelectDidcommCredential={onSelectCredential}
      accept={onAccept}
      refuse={onRefuse}
      serviceInfo={serviceInfo}
      isAccepting={isAccepting}
      notifyNoCompatibleCredentials={notify}
    />
  ) : null
}

export default DidcommPresentationRequest
