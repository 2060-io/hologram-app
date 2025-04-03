import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import BaseForward from '../Forward/BaseForward'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { useCredentialById, useMobileAgent } from '@2060/hooks/agent'
import { getDidCommCredentialDisplayMetadata } from '@2060/services/agent/RecordMetadata'
import { getCredentialDetailsForDisplay } from '@2060/services/agent/display'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'
import { log } from '@2060/utils'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredential'> {}

type AnoncredsAttribute = {
  name: string
  credentialDefinitionId: string
}

const PresentCredential = ({ navigation, route }: Props) => {
  const { credentialRecordId } = route.params
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const credentialRecord = useCredentialById(credentialRecordId)

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

      connectionsId.forEach(async connectionId => {
        const response = await agent.proofs.proposeProof({
          proofFormats: { anoncreds: { attributes: anoncredsAttributes } },
          connectionId,
          protocolVersion: 'v2',
        })
        log('present to response', connectionsId, response)
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
