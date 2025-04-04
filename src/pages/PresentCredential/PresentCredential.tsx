import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import BaseForward from '../Forward/BaseForward'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType, useCredentialById, useMobileAgent } from '@2060/hooks/agent'
import { AnoncredsAttribute } from '@2060/hooks/agent/actions/AgentActionExecuter'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { getDidCommCredentialDisplayMetadata } from '@2060/services/agent/RecordMetadata'
import { getCredentialDetailsForDisplay } from '@2060/services/agent/display'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredential'> {}

const PresentCredential = ({ navigation, route }: Props) => {
  const { credentialRecordId } = route.params
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const credentialRecord = useCredentialById(credentialRecordId)
  const { addAgentActionToQueue } = useAgentActionQueue()

  const presentCredential = useCallback(
    (connectionsId: string[]) => {
      if (!agent) return
      const metadata = credentialRecord ? getDidCommCredentialDisplayMetadata(credentialRecord) : undefined
      const credentialDefinitionId = metadata?.issuerId
      if (!credentialDefinitionId) return
      const credentialDetails = credentialRecord
        ? getCredentialDetailsForDisplay(credentialRecord)
        : undefined
      const anoncredsAttributes: AnoncredsAttribute[] = []
      const detailsSections = credentialDetails ? formatCredentialSubject(credentialDetails.attributes) : []
      detailsSections.forEach(section => {
        section.rows.forEach(row => {
          anoncredsAttributes.push({ name: row.key, credentialDefinitionId })
        })
      })
      connectionsId.forEach(connectionId => {
        addAgentActionToQueue({
          type: AgentActionType.PresentCredential,
          parameters: {
            anoncredsAttributes,
            didcommConnectionId: connectionId,
          },
        })
      })
      toast({
        type: 'success',
        message: t('credential.presented'),
      })
      navigation.goBack()
    },
    [credentialRecord],
  )

  return (
    <BaseForward navigation={navigation} onPressSend={presentCredential} title={t('credential.presentTo')} />
  )
}

export default PresentCredential
