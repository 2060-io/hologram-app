import { ProofState } from '@credo-ts/core'
import { HeaderBackButton } from '@react-navigation/elements'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, TouchableOpacity, View } from 'react-native'

import getStyles from './styles'

import { CredentialAttributes, ModalConfirmAction } from '@2060/components'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { CredentialMainInformation, Text } from '@2060/components/common'
import { AgentActionType } from '@2060/hooks/agent'
import {
  AcceptProofProposalParameters,
  ProofSendProblemReportParameters,
} from '@2060/hooks/agent/actions/types'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { toast } from '@2060/utils/toast'

type Props = {
  navigation: StackNavigationProp<
    NavigationStackParams,
    'CredentialPresentation' | 'EphemeralCredentialPresentation',
    undefined
  >
  credentialMainInfo: CredentialMainInfo | null
  credentialAttributes: Record<string, unknown>
  proofState: ProofState
  proofRecordId: string
  onAcceptCallback?: () => void
  onRefuseCallback?: () => void
}

const BaseCredentialPresentation = ({
  navigation,
  proofState,
  credentialMainInfo,
  credentialAttributes,
  proofRecordId,
  onAcceptCallback,
  onRefuseCallback,
}: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [showModalRefuseConfirmation, setShowModalRefuseConfirmation] = useState(false)
  const enableMainButtons = proofState === ProofState.ProposalReceived

  useEffect(() => {
    navigation.setOptions({
      headerLeft: props =>
        enableMainButtons ? (
          <TouchableOpacity style={styles.headerLeft} onPress={displayModalRefuseConfirmation}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.refuse')}
            </Text>
          </TouchableOpacity>
        ) : (
          <HeaderBackButton {...props} />
        ),
      headerRight: () =>
        enableMainButtons ? (
          <TouchableOpacity style={styles.headerRight} onPress={accept}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.accept')}
            </Text>
          </TouchableOpacity>
        ) : null,
    })
  }, [enableMainButtons])

  const displayModalRefuseConfirmation = () => setShowModalRefuseConfirmation(true)
  const hideModalRefuseConfirmation = () => setShowModalRefuseConfirmation(false)

  const accept = () => {
    const parameters: AcceptProofProposalParameters = { proofRecordId }
    addAgentActionToQueue({ type: AgentActionType.AcceptProofProposal, parameters })
    onAcceptCallback?.()
  }

  const refuse = () => {
    const parameters: ProofSendProblemReportParameters = { proofRecordId, description: 'refused' }
    addAgentActionToQueue({ type: AgentActionType.ProofSendProblemReport, parameters })
    hideModalRefuseConfirmation()
    toast({ type: 'error', message: 'You refused credential presentation', duration: 5000 })
    onRefuseCallback?.()
    navigation.goBack()
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.subContainer}>
            {proofState !== ProofState.PresentationReceived && (
              <Text fontFamily="EuclidCircularA-Medium" style={styles.valuesNoRevealedYet}>
                {t('presentationRequest.valuesNoRevealedYet')}
              </Text>
            )}
            {credentialMainInfo && (
              <CredentialMainInformation
                credentialMainInfo={credentialMainInfo}
                containerStyle={styles.credentialMainInfoContainer}
              />
            )}
            <CredentialAttributes attributes={credentialAttributes} />
          </View>
        </ScrollView>
      </SafeAreaView>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('personalChat.confirmRefuseVerifiablePresentation')}
        confirmText={t('general.confirm')}
        cancelText="No"
        onClose={hideModalRefuseConfirmation}
        onConfirm={refuse}
        onCancel={hideModalRefuseConfirmation}
      />
    </>
  )
}

export default BaseCredentialPresentation
