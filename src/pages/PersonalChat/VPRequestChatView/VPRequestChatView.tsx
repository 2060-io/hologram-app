/* eslint-disable react/no-unstable-nested-components */

import { ProofState } from '@credo-ts/core'
import { useNavigation, ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useState, memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, View } from 'react-native'

import { ChatParticipant } from '../ChatMessage/Props'
import { Header, OutlinedBlueButton, BlueButton } from '../components'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { Text } from '@2060/components/common'
import { AgentActionType } from '@2060/hooks/agent'
import { updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { VerifierInfo, VPRequestMetadata } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { RequestedCredentialItem } from '@2060/services/agent/display'
import {
  FormattedSubmission,
  formatDidcommPresentationSubmission,
} from '@2060/services/agent/formatPresentation'
import { notifyNoCompatibleCredentials } from '@2060/services/agent/proofs'

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
  proofState: ProofState
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
    metadata.proofState === ProofState.RequestReceived && getFormattedPresentation()
  }, [])

  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)
  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)

  const notify = async () => {
    if (!agent || !realm) return
    const newMetadata = { ...metadata, proofState: ProofState.Abandoned }
    updateChatEntryMetadata(realm, chatEntryId, newMetadata)
    notifyNoCompatibleCredentials({ agent, proofRecordId })
  }

  const goToDidCommPresentationRequest = () => {
    navigation.navigate('DidcommPresentationRequest', {
      proofRecordId,
      did: verifierInfo.id,
    })
  }

  const refuse = async () => {
    if (realm) {
      const newMetadata = { ...metadata, proofState: ProofState.Declined }
      updateChatEntryMetadata(realm, chatEntryId, newMetadata)
    }
    addAgentActionToQueue({
      type: AgentActionType.DeclineProofRequest,
      parameters: { proofRecordId },
    })
  }

  const refuseFromChat = async () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  if (!metadata) return <View />

  const NoCompatibleCredentials = () => (
    <View>
      <Text style={styles.title} typography="EuclidCircularA-Regular">
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
    const opacity = proofState === ProofState.RequestReceived ? 1 : 0.3
    return (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton
          disabled={proofState !== ProofState.RequestReceived}
          text={t('general.refuse')}
          onPress={displayModalRefuseConfirmation}
          style={[styles.refuseButton, { opacity }]}
        />
        <BlueButton
          disabled={proofState !== ProofState.RequestReceived}
          text={t('presentationRequest.selectCredential', {
            count: requestedCredentialsForDisplay?.requestedCredentials?.length,
          })}
          onPress={goToDidCommPresentationRequest}
          style={[styles.acceptButton, { opacity }]}
        />
      </View>
    )
  }

  const status: Partial<Record<ProofState, React.ReactElement>> = {
    [ProofState.Abandoned]: (
      <>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
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
    [ProofState.Declined]: (
      <View style={[styles.baseFooterContainer, styles.refusedContainer]}>
        <Text typography="EuclidCircularA-Bold" style={styles.refusedText}>
          {t('personalChat.youRefusedRequest')}
        </Text>
      </View>
    ),
  }

  const renderFooterOptions = (proofState: ProofState) => {
    if (proofState === ProofState.RequestReceived && !formattedPresentationRequest) {
      return <ActivityIndicator color={theme.colors.green} />
    }
    if (proofState === ProofState.RequestReceived && !formattedPresentationRequest?.areAllSatisfied) {
      return <NoCompatibleCredentials />
    }
    return status[proofState] ?? <MainButtons proofState={proofState} />
  }
  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefusePresentCredential')}
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
            <Text style={styles.title} typography="EuclidCircularA-Regular">
              {t('personalChat.isRequestingYou', {
                sender: senderName,
                schemaName: requestedCredential?.schemaName,
              })}
            </Text>
            <View style={styles.credentialAttributesContainer}>
              {requestedCredential?.attributes?.map((attribute: string) => (
                <View key={attribute} style={styles.credentialAttributeContainer}>
                  <Text typography="EuclidCircularA-Bold" style={styles.credentialAttribute}>
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
