import { ProofState } from '@credo-ts/core'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { CredentialMainInformation, Text } from '@2060/components/common'
import { AgentActionType, useChat } from '@2060/hooks/agent'
import { AcceptProofProposalParameters, RefuseProofProposalParameters } from '@2060/hooks/agent/actions/types'
import { updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, VPResponseMetadata, VPResponsePresentedCredential } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { toast } from '@2060/utils/toast'

type Props = {
  metadata: VPResponseMetadata
  role: ChatEntryRole
  agent?: MobileAgent
  proofRecordId: string
  chatEntryId: string
}

const VPChatView = ({ metadata, role, agent, proofRecordId, chatEntryId }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { chatThread } = useChat()
  const { realm } = useLocalRealm()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const navigation: StackNavigationProp<NavigationStackParams> = useNavigation()
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const { presentedCredentials: pc, proofState } = metadata
  const otherSidesName = chatThread?.participants.find(p => p.id === ChatEntryRole.Receiver)?.name
  const presentedCredentials: VPResponsePresentedCredential[] = pc ? JSON.parse(pc) : []
  const isSender = role === ChatEntryRole.Sender
  const mainMessage = isSender
    ? t('presentationRequest.youPresented', {
        verifier: otherSidesName,
        count: presentedCredentials.length,
      })
    : t('presentationRequest.isPresentingCredentialToYou', {
        requestor: otherSidesName,
        count: presentedCredentials.length,
      })

  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)
  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)

  const chooseWhereToGo = (credential: VPResponsePresentedCredential) => {
    isSender ? verifyCanGoToCredentialDetails(credential.mainInfo.recordId) : goToPresentation(credential)
  }

  const goToPresentation = (credential: VPResponsePresentedCredential) => {
    navigation.navigate('CredentialPresentation', {
      credentialMainInfo: credential.mainInfo,
      credentialAttributes: credential.attributes ?? {},
      proofState,
      proofRecordId,
    })
  }

  const verifyCanGoToCredentialDetails = async (credentialRecordId: string) => {
    if (!agent) return
    try {
      await agent.w3cCredentials.getCredentialRecordById(credentialRecordId)
      navigation.navigate('CredentialDetails', { credentialRecordId })
    } catch (error) {
      toast({ type: 'error', message: t('personalChat.noCredentialFound') })
    }
  }

  const acceptCredentialPresentation = async () => {
    if (realm) {
      const newMetadata = { ...metadata, proofState: ProofState.RequestSent }
      updateChatEntryMetadata(realm, chatEntryId, newMetadata)
    }
    const parameters: AcceptProofProposalParameters = { proofRecordId }
    addAgentActionToQueue({ type: AgentActionType.AcceptProofProposal, parameters })
  }

  const refuseCredentialPresentation = async () => {
    hideModalRefuseConfirmation()
    if (realm) {
      const newMetadata = { ...metadata, proofState: ProofState.Abandoned }
      updateChatEntryMetadata(realm, chatEntryId, newMetadata)
    }
    const parameters: RefuseProofProposalParameters = { proofRecordId }
    addAgentActionToQueue({ type: AgentActionType.RefuseProofProposal, parameters })
  }

  const status: Record<ProofState, React.ReactElement | null> = {
    [ProofState.ProposalSent]: <State text={t('presentationRequest.waitingForAcceptance')} type="warning" />,
    [ProofState.ProposalReceived]: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton
          text={t('general.refuse')}
          onPress={displayModalRefuseConfirmation}
          style={styles.refuseButton}
        />
        <BlueButton
          text={t('general.accept')}
          onPress={acceptCredentialPresentation}
          style={styles.acceptButton}
        />
      </View>
    ),
    [ProofState.RequestSent]: <State text={t('presentationRequest.accepted')} />,
    [ProofState.RequestReceived]: <State text={t('presentationRequest.accepted')} />,
    [ProofState.PresentationReceived]: <State text={t('presentationRequest.accepted')} />,
    [ProofState.Declined]: <State text={t('presentationRequest.refused')} type="error" />,
    [ProofState.Abandoned]: <State text={t('presentationRequest.refused')} type="error" />,
    [ProofState.Done]: null,
    [ProofState.PresentationSent]: null,
  }

  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefuseVerifiablePresentation')}
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuseCredentialPresentation}
        onCancel={hideModalRefuseConfirmation}
      />
      <Header
        theme={theme}
        title={t('presentationRequest.verifiablePresentation')}
        leftIconName="id"
        role={role}
      />
      <View style={styles.subContainer}>
        <Text style={styles.title}>{mainMessage}</Text>
        {presentedCredentials.map((credential, index) => {
          const isLast = index === presentedCredentials.length - 1
          const { mainInfo } = credential
          return (
            <CredentialMainInformation
              key={mainInfo.id}
              credentialMainInfo={mainInfo}
              containerStyle={isLast ? styles.lastCredential : styles.credential}
              onPress={() => {
                chooseWhereToGo({ mainInfo, attributes: credential.attributes })
              }}
              size="medium"
            />
          )
        })}
        <View style={styles.footerContainer}>{status[proofState]}</View>
      </View>
    </View>
  )
}

export default memo(VPChatView)
