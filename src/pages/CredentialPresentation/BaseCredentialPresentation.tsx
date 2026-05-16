import { DidCommProofState } from '@credo-ts/didcomm'
import { HeaderBackButton } from '@react-navigation/elements'
import { StackNavigationProp } from '@react-navigation/stack'
import { CredentialAttributes, ModalConfirmAction } from '@src/components'
import { CredentialMainInformation, HeaderTitle, Text } from '@src/components/common'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { AgentActionType, useAgentActionQueue } from '@src/hooks/agent'
import {
  AcceptProofProposalParameters,
  ProofSendProblemReportDescription,
  ProofSendProblemReportParameters,
} from '@src/hooks/agent/actions/types'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { CredentialMainInfo } from '@src/services/agent/display'
import { toast } from '@src/utils/toast'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import getStyles from './styles'

type Props = {
  navigation: StackNavigationProp<
    NavigationStackParams,
    'CredentialPresentation' | 'EphemeralCredentialPresentation',
    undefined
  >
  credentialMainInfo: CredentialMainInfo | null
  credentialAttributes: Record<string, unknown>
  proofState: DidCommProofState
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
  const enableMainButtons = proofState === DidCommProofState.ProposalReceived

  useEffect(() => {
    navigation.setOptions({
      headerLeft: (props) =>
        enableMainButtons ? (
          <TouchableOpacity style={styles.headerLeft} onPress={displayModalRefuseConfirmation}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.refuse')}
            </Text>
          </TouchableOpacity>
        ) : (
          <HeaderBackButton {...props} />
        ),
      headerTitle: () => <HeaderTitle title={t('navigation.CredentialPresentation')} theme={theme} />,
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
    const parameters: ProofSendProblemReportParameters = {
      proofRecordId,
      description: ProofSendProblemReportDescription.Refused,
    }
    addAgentActionToQueue({ type: AgentActionType.ProofSendProblemReport, parameters })
    hideModalRefuseConfirmation()
    toast({ type: 'error', message: t('credential.youRefusedPresentation'), duration: 5000 })
    onRefuseCallback?.()
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.subContainer}>
            <CredentialMainInformation credentialMainInfo={credentialMainInfo} />
            {![DidCommProofState.PresentationReceived, DidCommProofState.Done].includes(proofState) && (
              <Text fontFamily="EuclidCircularA-Medium" style={styles.valuesNoRevealedYet}>
                {t('presentationRequest.valuesNoRevealedYet')}
              </Text>
            )}
            <CredentialAttributes attributes={credentialAttributes} />
          </View>
        </ScrollView>
      </SafeAreaView>
      <ModalConfirmAction
        visible={showModalRefuseConfirmation}
        title={t('chat.confirmRefuseVerifiablePresentation')}
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
