import { ProofState, W3cCredentialRepository } from '@credo-ts/core'
import { ParamListBase, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { CardCredentialMainInformation, Text } from '@2060/components/common'
import { useChat } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, VPResponseMetadata } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { toast } from '@2060/utils/toast'

type Props = {
  metadata: VPResponseMetadata
  role: ChatEntryRole
  agent?: MobileAgent
  proofRecordId: string
}

const VPChatView = ({ metadata, role, agent, proofRecordId }: Props) => {
  const { chatThread } = useChat()
  const otherSidesName = chatThread?.participants.find(p => p.id === ChatEntryRole.Receiver)?.name
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const { presentedCredentials, proofState } = metadata
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

  const goToDetails = async (credentialRecordId: string) => {
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
    await agent?.proofs.acceptProposal({ proofRecordId })
  }

  const refuseCredentialPresentation = async () => {
    hideModalRefuseConfirmation()
    await agent?.proofs.sendProblemReport({ proofRecordId, description: 'refused' })
  }

  const status: Record<ProofState, React.ReactElement> = {
    [ProofState.RequestReceived]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        RequestReceived
      </Text>
    ),
    [ProofState.RequestSent]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        RequestSent
      </Text>
    ),
    [ProofState.PresentationReceived]: <State text={t('presentationRequest.received')} />,
    [ProofState.PresentationSent]: <></>,
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
    [ProofState.ProposalSent]: <></>,
    [ProofState.Declined]: <State text={t('presentationRequest.refused')} type="error" />,
    [ProofState.Abandoned]: <State text={t('presentationRequest.refused')} type="error" />,
    [ProofState.Done]: <State text={t('presentationRequest.received')} />,
  }

  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefuseCredentialPresentation')}
        subTitle=""
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuseCredentialPresentation}
        onCancel={hideModalRefuseConfirmation}
      />
      <Header
        theme={theme}
        title={isSender ? t('presentationRequest.sent') : t('presentationRequest.received')}
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
              onPress={() => goToDetails(credential.recordId)}
              size="medium"
            />
          )
        })}
        {status[proofState]}
      </View>
    </View>
  )
}

export default memo(VPChatView)
