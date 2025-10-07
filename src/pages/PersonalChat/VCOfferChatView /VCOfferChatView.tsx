import { CredentialState } from '@credo-ts/core'
import { useNavigation, ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import React, { useState, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ChatParticipant } from '../ChatMessage/Props'
import { BlueButton, Header, OutlinedBlueButton, State } from '../components'

import getStyles from './styles'

import { ModalConfirmAction } from '@2060/components'
import { CardCredentialMainInformation, Text } from '@2060/components/common'
import { AgentActionType } from '@2060/hooks/agent'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { VCOfferMetadata } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { CredentialMainInfo, sanitizeString } from '@2060/services/agent/display'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props {
  sender?: ChatParticipant
  associatedRecordId: string
  metadata: VCOfferMetadata
  agent?: MobileAgent
}

const VCOfferChatView = ({ sender, associatedRecordId, metadata, agent }: Props): React.ReactElement => {
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { t } = useTranslation()
  const { credentialState } = metadata
  const opacity = credentialState !== CredentialState.OfferReceived ? 0.3 : 1

  const credentialMainInfo: CredentialMainInfo = useMemo(
    () => ({
      id: '',
      recordId: '',
      createdAt: new Date(metadata.issuedAt),
      schemaName: sanitizeString(metadata.schemaName),
      issuer: {
        id: metadata.issuerId ?? '',
        name: metadata.issuerName ?? sender?.name ?? '',
        logoUrl: metadata.issuerLogoUrl ?? sender?.avatar,
        status: TrustResolutionOutcome.INVALID,
      },
    }),
    [metadata],
  )

  const accept = () => {
    addAgentActionToQueue({
      type: AgentActionType.AcceptCredentialOffer,
      parameters: { credentialRecordId: associatedRecordId },
    })
  }

  const refuse = () => {
    agent?.credentials
      .declineOffer(associatedRecordId, {
        sendProblemReport: true,
        problemReportDescription: 'e.msg.refused',
      })
      .catch(error => logError(`Error refusing credential ${error}`))
  }

  const refuseFromChat = () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)
  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)

  const chooseScreenToGo = () => {
    if ([CredentialState.OfferReceived, CredentialState.RequestSent].includes(credentialState)) {
      goToCredentialOffer()
    }
    if ([CredentialState.CredentialReceived, CredentialState.Done].includes(credentialState)) {
      verifyCanGoToCredentialDetails()
    }
  }

  const verifyCanGoToCredentialDetails = async () => {
    if (!agent) return
    try {
      const credentialRecordId = (await agent.credentials.getById(associatedRecordId)).credentials[0]
        .credentialRecordId
      goToCredentialDetails(credentialRecordId)
    } catch (error) {
      toast({ type: 'error', message: t('personalChat.noCredentialFound') })
    }
  }

  const goToCredentialDetails = async (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }

  const goToCredentialOffer = async () => {
    navigation.navigate('DidcommCredentialOffer', { credentialRecordId: associatedRecordId })
  }

  if (!metadata) return <View />

  const status: Partial<Record<CredentialState, React.ReactElement>> = {
    [CredentialState.OfferReceived]: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton
          text={t('general.refuse')}
          onPress={displayModalRefuseConfirmation}
          style={[styles.refuseButton, { opacity }]}
        />
        <BlueButton text={t('general.accept')} onPress={accept} style={[styles.acceptButton, { opacity }]} />
      </View>
    ),
    [CredentialState.RequestSent]: (
      <View style={[styles.baseFooterContainer, styles.acceptingContainer]}>
        <Text typography="EuclidCircularA-Bold" style={styles.acceptingText}>
          {t('personalChat.accepting')}
        </Text>
      </View>
    ),
    [CredentialState.Declined]: <State text={t('personalChat.youRefusedCredential')} type="error" />,
    [CredentialState.CredentialReceived]: <State text={t('personalChat.credentialAdded')} />,
    [CredentialState.Done]: <State text={t('personalChat.credentialAdded')} />,
  }
  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefuseCredentialOffer')}
        subTitle=""
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuseFromChat}
        onCancel={hideModalRefuseConfirmation}
      />
      <Header theme={theme} title={t('credentialOffer.title')} leftIconName="id" />
      <View style={styles.subContainer}>
        <Text style={styles.title} typography="EuclidCircularA-Regular">
          {t('personalChat.offeringCredential', { sender: metadata.issuerName ?? sender?.name })}
        </Text>
        <CardCredentialMainInformation
          credentialMainInfo={credentialMainInfo}
          containerStyle={styles.credentialMainInfoContainer}
          onPress={chooseScreenToGo}
          size="medium"
        />
        {status[credentialState]}
      </View>
    </View>
  )
}

export default memo(VCOfferChatView)
