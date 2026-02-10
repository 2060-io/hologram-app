import { DidCommCredentialState } from '@credo-ts/didcomm'
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
import { CredentialMainInformation, Text } from '@2060/components/common'
import { AgentActionType, useAgentActionQueue } from '@2060/hooks/agent'
import {
  AcceptCredentialOfferParameters,
  DeclineCredentialOfferParameters,
} from '@2060/hooks/agent/actions/types'
import { updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { VCOfferMetadata } from '@2060/model'
import { MobileAgent } from '@2060/services/agent'
import { CredentialMainInfo, sanitizeString } from '@2060/services/agent/display'
import { toast } from '@2060/utils/toast'

interface Props {
  sender?: ChatParticipant
  associatedRecordId: string
  metadata: VCOfferMetadata
  agent?: MobileAgent
  chatEntryId: string
}

const VCOfferChatView = ({
  sender,
  associatedRecordId,
  metadata,
  agent,
  chatEntryId,
}: Props): React.ReactElement => {
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { realm } = useLocalRealm()
  const { credentialState } = metadata
  const opacity = credentialState !== DidCommCredentialState.OfferReceived ? 0.3 : 1

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

  const updateMetadata = (newCredentialState: DidCommCredentialState) => {
    if (!realm) return
    const newMetadata = { ...metadata, credentialState: newCredentialState }
    updateChatEntryMetadata(realm, chatEntryId, newMetadata)
  }

  const accept = () => {
    updateMetadata(DidCommCredentialState.RequestSent)
    const parameters: AcceptCredentialOfferParameters = { credentialRecordId: associatedRecordId }
    addAgentActionToQueue({
      type: AgentActionType.AcceptCredentialOffer,
      parameters,
    })
  }

  const refuse = () => {
    updateMetadata(DidCommCredentialState.Declined)
    const parameters: DeclineCredentialOfferParameters = { credentialRecordId: associatedRecordId }
    addAgentActionToQueue({
      type: AgentActionType.DeclineCredentialOffer,
      parameters,
    })
  }

  const refuseFromChat = () => {
    hideModalRefuseConfirmation()
    refuse()
  }

  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)
  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)

  const chooseScreenToGo = () => {
    if (
      [DidCommCredentialState.OfferReceived, DidCommCredentialState.RequestSent].includes(credentialState)
    ) {
      goToCredentialOffer()
    }
    if ([DidCommCredentialState.CredentialReceived, DidCommCredentialState.Done].includes(credentialState)) {
      verifyCanGoToCredentialDetails()
    }
  }

  const verifyCanGoToCredentialDetails = async () => {
    if (!agent) return
    try {
      const credentialRecordId = (await agent.didcomm.credentials.getById(associatedRecordId)).credentials[0]
        .credentialRecordId
      goToCredentialDetails(credentialRecordId)
    } catch (error) {
      toast({ type: 'error', message: t('chatConversation.noCredentialFound') })
    }
  }

  const goToCredentialDetails = async (credentialRecordId: string) => {
    navigation.navigate('CredentialDetails', { credentialRecordId })
  }

  const goToCredentialOffer = async () => {
    navigation.navigate('DidcommCredentialOffer', { credentialRecordId: associatedRecordId })
  }

  if (!metadata) return <View />

  const status: Partial<Record<DidCommCredentialState, React.ReactElement>> = {
    [DidCommCredentialState.OfferReceived]: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton
          text={t('general.refuse')}
          onPress={displayModalRefuseConfirmation}
          style={[styles.refuseButton, { opacity }]}
        />
        <BlueButton text={t('general.accept')} onPress={accept} style={[styles.acceptButton, { opacity }]} />
      </View>
    ),
    [DidCommCredentialState.RequestSent]: (
      <View style={[styles.baseFooterContainer, styles.acceptingContainer]}>
        <Text fontFamily="EuclidCircularA-Bold" style={styles.acceptingText}>
          {t('chatConversation.accepting')}
        </Text>
      </View>
    ),
    [DidCommCredentialState.Declined]: <State text={t('chatConversation.youRefusedCredential')} type="error" />,
    [DidCommCredentialState.CredentialReceived]: <State text={t('chatConversation.credentialAdded')} />,
    [DidCommCredentialState.Done]: <State text={t('chatConversation.credentialAdded')} />,
  }
  return (
    <View style={styles.container}>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('chatConversation.confirmRefuseCredentialOffer')}
        subTitle=""
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuseFromChat}
        onCancel={hideModalRefuseConfirmation}
      />
      <Header theme={theme} title={t('credentialOffer.title')} leftIconName="id" />
      <View style={styles.subContainer}>
        <Text style={styles.title}>
          {t('chatConversation.offeringCredential', { sender: metadata.issuerName ?? sender?.name })}
        </Text>
        <CredentialMainInformation
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
