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
import { CardCredentialMainInformation, Text } from '@2060/components/common'
import { useChat } from '@2060/hooks/agent'
import { updateMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, VPResponseMetadata, VPResponsePresentedCredential } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
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
    navigation.navigate('Presentation', {
      mainInfo: credential.mainInfo,
      attributes: credential.attributes ?? {},
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
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          {mainMessage}
        </Text>
        {presentedCredentials.map((credential, index) => {
          const isLast = index === presentedCredentials.length - 1
          const credentialMainInfo = {
            ...credential.mainInfo,
            dateLabel: isSender ? t('credential.issuedOn') : t('credential.presentedOn'),
          }
          return (
            <CardCredentialMainInformation
              key={credential.mainInfo.id}
              credentialMainInfo={credentialMainInfo}
              containerStyle={{ marginBottom: isLast ? 0 : theme.edges.messageMargin }}
              onPress={() => {
                chooseWhereToGo({ mainInfo: credentialMainInfo, attributes: credential.attributes })
              }}
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
