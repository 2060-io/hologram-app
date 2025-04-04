import { ProofState, W3cCredentialRepository } from '@credo-ts/core'
import { ParamListBase, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlueButton, Header, OutlinedBlueButton } from '../components'

import getStyles from './styles'

import { CardCredentialMainInformation, Text } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, VPResponseMetadata } from '@2060/model'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { toast } from '@2060/utils/toast'

type Props = {
  metadata: VPResponseMetadata
  role: ChatEntryRole
  verifierName?: string
}

const VPChatView = ({ metadata, role, verifierName }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const { agent } = useMobileAgent()
  const { presentedCredentials, proofState } = metadata
  const presentedCredentialsForDisplay: CredentialMainInfo[] = presentedCredentials
    ? JSON.parse(presentedCredentials)
    : []
  const isSender = role === ChatEntryRole.Sender
  const mainMessage = isSender
    ? t('presentationRequest.youPresented', {
        verifier: verifierName,
        count: presentedCredentialsForDisplay.length,
      })
    : t('presentationRequest.isPresentingCredentialToYou', {
        requestor: verifierName,
        count: presentedCredentialsForDisplay.length,
      })

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
  const acceptCredentialPresentation = () => {}
  const refuseCredentialPresentation = () => {}

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
    [ProofState.PresentationReceived]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        PresentationReceived
      </Text>
    ),
    [ProofState.PresentationSent]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        PresentationSent
      </Text>
    ),
    [ProofState.ProposalReceived]: (
      <View style={styles.buttonsContainer}>
        <OutlinedBlueButton
          text={t('general.refuse')}
          onPress={refuseCredentialPresentation}
          style={styles.refuseButton}
        />
        <BlueButton
          text={t('general.accept')}
          onPress={acceptCredentialPresentation}
          style={styles.acceptButton}
        />
      </View>
    ),
    [ProofState.ProposalSent]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        ProposalSent
      </Text>
    ),
    [ProofState.Declined]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        Declined
      </Text>
    ),
    [ProofState.Abandoned]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        Abandoned
      </Text>
    ),
    [ProofState.Done]: (
      <Text typography="EuclidCircularA-Regular" style={styles.text}>
        Done
      </Text>
    ),
  }

  return (
    <View style={styles.container}>
      <Header
        theme={theme}
        title={isSender ? t('presentationRequest.sent') : t('presentationRequest.title')}
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
