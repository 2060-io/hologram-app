/* eslint-disable react/no-unstable-nested-components */

import { DidCommProofState } from '@credo-ts/didcomm'
import { useNavigation, ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, View } from 'react-native'

import { ChatParticipant } from '../ChatMessage/Props'
import { Header, OutlinedBlueButton, BlueButton } from '../components'

import getStyles from './styles'

import { ModalConfirmAction } from '@src/components'
import { Text } from '@src/components/common'
import { AgentActionType, useAgentActionQueue } from '@src/hooks/agent'
import {
  DeclineProofRequestParameters,
  ProofSendProblemReportDescription,
  ProofSendProblemReportParameters,
} from '@src/hooks/agent/actions/types'
import { updateChatEntryMetadata } from '@src/hooks/agent/chat/services'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { VerifierInfo, VPRequestMetadata } from '@src/model'
import { MobileAgent } from '@src/services/agent'
import { RequestedCredentialItem } from '@src/services/agent/display'
import {
  FormattedSubmission,
  formatDidcommPresentationSubmission,
} from '@src/services/agent/formatPresentation'

interface Props {
  sender?: ChatParticipant
  proofRecordId: string
  metadata: VPRequestMetadata
  agent?: MobileAgent
  chatEntryId: string
}

type RequestedCredentialsForDisplay = {
  requestedCredentials: RequestedCredentialItem[]
  verifier: VerifierInfo
}

type MainButtonsProps = {
  proofState: DidCommProofState
}

const VPRequestChatView = ({
  sender,
  proofRecordId,
  metadata,
  agent,
  chatEntryId,
}: Props): React.ReactElement => {
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { realm } = useLocalRealm()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const [formattedPresentationRequest, setFormattedPresentationRequest] = useState<FormattedSubmission>()

  const requestedCredentialsForDisplay: RequestedCredentialsForDisplay = JSON.parse(
    metadata.requestedAttributes,
  )

  const { verifier: verifierInfo } = requestedCredentialsForDisplay
  const senderName = sender?.name?.length ? sender.name : verifierInfo.name

  useEffect(() => {
    const getFormattedPresentation = async () => {
      if (!agent) return
      const newFormattedPresentationRequest = await formatDidcommPresentationSubmission({
        agent,
        proofRecordId,
        verifierInfo,
      })
      setFormattedPresentationRequest(newFormattedPresentationRequest)
    }
    if (metadata.proofState === DidCommProofState.RequestReceived) getFormattedPresentation()
  }, [])

  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)
  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)

  const notify = async () => {
    if (!agent || !realm) return
    const newMetadata = { ...metadata, proofState: DidCommProofState.Abandoned }
    updateChatEntryMetadata(realm, chatEntryId, newMetadata)
    const parameters: ProofSendProblemReportParameters = {
      proofRecordId,
      description: ProofSendProblemReportDescription.NoCompatibleCredentials,
    }
    addAgentActionToQueue({ type: AgentActionType.ProofSendProblemReport, parameters })
  }

  const goToDidCommPresentationRequest = () => {
    navigation.navigate('DidcommPresentationRequest', {
      proofRecordId,
      did: verifierInfo.id,
    })
  }

  const refuse = async () => {
    if (realm) {
      const newMetadata = { ...metadata, proofState: DidCommProofState.Declined }
      updateChatEntryMetadata(realm, chatEntryId, newMetadata)
    }
    const parameters: DeclineProofRequestParameters = { proofRecordId }
    addAgentActionToQueue({ type: AgentActionType.DeclineProofRequest, parameters })
  }

  const refuseFromChat = async () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  const NoCompatibleCredentials = () => (
    <View>
      <Text style={styles.title}>
        {t('presentationRequest.noCompatibleCredentials', { sender: senderName })}
      </Text>
      <BlueButton
        text={t('presentationRequest.notify', { sender: senderName })}
        onPress={notify}
        style={styles.notifyButton}
      />
    </View>
  )

  const MainButtons = ({ proofState }: MainButtonsProps) => {
    const opacity = proofState === DidCommProofState.RequestReceived ? 1 : 0.3
    return (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton
          disabled={proofState !== DidCommProofState.RequestReceived}
          text={t('general.refuse')}
          onPress={displayModalRefuseConfirmation}
          style={[styles.refuseButton, { opacity }]}
        />
        <BlueButton
          disabled={proofState !== DidCommProofState.RequestReceived}
          text={t('presentationRequest.selectCredential', {
            count: requestedCredentialsForDisplay?.requestedCredentials?.length,
          })}
          onPress={goToDidCommPresentationRequest}
          style={[styles.acceptButton, { opacity }]}
        />
      </View>
    )
  }

  const status: Partial<Record<DidCommProofState, React.ReactElement>> = {
    [DidCommProofState.Abandoned]: (
      <>
        <Text style={styles.title}>
          {t('presentationRequest.noCompatibleCredentials', { sender: senderName })}
        </Text>
        <BlueButton
          disabled
          text={t('presentationRequest.notified', { sender: senderName })}
          onPress={undefined}
          style={styles.notifiedContainer}
        />
      </>
    ),
    [DidCommProofState.Declined]: (
      <View style={[styles.baseFooterContainer, styles.refusedContainer]}>
        <Text fontFamily="EuclidCircularA-Bold" style={styles.refusedText}>
          {t('chat.youRefusedRequest')}
        </Text>
      </View>
    ),
  }

  const renderFooterOptions = (proofState: DidCommProofState) => {
    if (proofState === DidCommProofState.RequestReceived && !formattedPresentationRequest) {
      return <ActivityIndicator color={theme.colors.green} />
    }
    if (proofState === DidCommProofState.RequestReceived && !formattedPresentationRequest?.areAllSatisfied) {
      return <NoCompatibleCredentials />
    }
    return status[proofState] ?? <MainButtons proofState={proofState} />
  }
  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('chat.confirmRefusePresentCredential')}
        subTitle=""
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuseFromChat}
        onCancel={hideModalRefuseConfirmation}
      />
      <Header theme={theme} title={t('presentationRequest.title')} leftIconName="id" />
      <View style={styles.subContainer}>
        {requestedCredentialsForDisplay?.requestedCredentials?.map(requestedCredential => (
          <View key={requestedCredential?.schemaName}>
            <Text style={styles.title}>
              {t('chat.isRequestingYou', {
                sender: senderName,
                schemaName: requestedCredential?.schemaName,
              })}
            </Text>
            <View style={styles.credentialAttributesContainer}>
              {requestedCredential?.attributes?.map((attribute: string) => (
                <View key={attribute} style={styles.credentialAttributeContainer}>
                  <Text fontFamily="EuclidCircularA-Bold" style={styles.credentialAttribute}>
                    {attribute}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {renderFooterOptions(metadata.proofState)}
      </View>
    </View>
  )
}

export default memo(VPRequestChatView)
