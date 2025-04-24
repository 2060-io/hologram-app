import { ProofState, W3cCredentialRepository } from '@credo-ts/core'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { CardCredentialMainInformation, Text } from '@2060/components/common'
import { useChat } from '@2060/hooks/agent'
import { updateMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, VPResponseMetadata } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { acceptProposal, sendProblemReport } from '@2060/services/agent/proofs'
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
  const navigation: StackNavigationProp<NavigationStackParams> = useNavigation()
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const { presentedCredentials, proofState, presentedCredentialClaims } = metadata
  const otherSidesName = chatThread?.participants.find(p => p.id === ChatEntryRole.Receiver)?.name
  const presentedCredentialsForDisplay: CredentialMainInfo[] = presentedCredentials
    ? JSON.parse(presentedCredentials)
    : []
  const isSender = role === ChatEntryRole.Sender
  const mainMessage = isSender
    ? t('presentationRequest.youPresented', {
        verifier: otherSidesName,
        count: presentedCredentialsForDisplay.length,
      })
    : t('presentationRequest.isPresentingCredentialToYou', {
        requestor: otherSidesName,
        count: presentedCredentialsForDisplay.length,
      })

  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)
  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)

  const chooseWhereToGo = (credentialMainInfo: CredentialMainInfo) => {
    isSender ? goToDetails(credentialMainInfo.recordId) : goToPresentation(credentialMainInfo)
  }

  const goToPresentation = (credentialMainInfo: CredentialMainInfo) => {
    navigation.navigate('Presentation', {
      mainInfo: credentialMainInfo,
      attributes: presentedCredentialClaims ? JSON.parse(presentedCredentialClaims) : {},
    })
  }

  const goToDetails = async (credentialRecordId: string) => {
    if (role === ChatEntryRole.Receiver) return
    // FIXME: generalize for any type of credential
    const credentialRecord = await agent?.dependencyManager
      .resolve(W3cCredentialRepository)
      .findById(agent.context, credentialRecordId)

    if (credentialRecord) {
      navigation.navigate('CredentialDetails', { credentialRecordId })
    } else {
      toast({ type: 'error', message: t('personalChat.noCredentialFound') })
    }
  }

  const acceptCredentialPresentation = async () => {
    if (!agent || !realm) return
    const newMetadata = { ...metadata, proofState: ProofState.PresentationReceived }
    updateMetadata(realm, chatEntryId, newMetadata)
    acceptProposal({ agent, proofRecordId })
  }

  const refuseCredentialPresentation = async () => {
    hideModalRefuseConfirmation()
    if (!agent || !realm) return
    const newMetadata = { ...metadata, proofState: ProofState.Abandoned }
    updateMetadata(realm, chatEntryId, newMetadata)
    sendProblemReport({ agent, proofRecordId, description: 'refused' })
  }

  const status: Partial<Record<ProofState, React.ReactElement>> = {
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
    [ProofState.RequestReceived]: <State text={t('presentationRequest.accepted')} />,
    [ProofState.PresentationReceived]: <State text={t('presentationRequest.accepted')} />,
    [ProofState.Done]: <State text={t('presentationRequest.accepted')} />,
    [ProofState.Declined]: <State text={t('presentationRequest.refused')} type="error" />,
    [ProofState.Abandoned]: <State text={t('presentationRequest.refused')} type="error" />,
  }

  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefuseCredentialPresentation')}
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuseCredentialPresentation}
        onCancel={hideModalRefuseConfirmation}
      />
      <Header
        theme={theme}
        title={t('presentationRequest.credentialPresentation')}
        leftIconName="id"
        role={role}
      />
      <View style={styles.subContainer}>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          {mainMessage}
        </Text>
        {presentedCredentialsForDisplay.map((credential, index) => {
          const isLast = index === presentedCredentialsForDisplay.length - 1
          return (
            <CardCredentialMainInformation
              key={credential.id}
              credentialMainInfo={credential}
              containerStyle={{ marginBottom: isLast ? 0 : theme.edges.messageMargin }}
              onPress={() => chooseWhereToGo(credential)}
              size="medium"
            />
          )
        })}
        {status[proofState] ? <View style={styles.footerContainer}>{status[proofState]}</View> : null}
      </View>
    </View>
  )
}

export default memo(VPChatView)
