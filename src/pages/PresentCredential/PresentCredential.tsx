import { ProofState } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import BaseForward from '../Forward/BaseForward'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType, useChats, useCredentialById, useMobileAgent } from '@2060/hooks/agent'
import { AnoncredsAttribute } from '@2060/hooks/agent/actions/AgentActionExecuter'
import { createChatEntry } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType } from '@2060/model'
import { getDidCommCredentialDisplayMetadata } from '@2060/services/agent/RecordMetadata'
import { getCredentialDetailsForDisplay, getCredentialMainInfo } from '@2060/services/agent/display'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<NavigationStackParams, 'PresentCredential'> {}

const PresentCredential = ({ navigation, route }: Props) => {
  const { credentialRecordId } = route.params
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const credentialRecord = useCredentialById(credentialRecordId)
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { findOrCreateThread } = useChats()

  const presentCredential = useCallback(
    (connectionsId: string[]) => {
      if (!agent || !realm) return
      const metadata = credentialRecord ? getDidCommCredentialDisplayMetadata(credentialRecord) : undefined
      const presentedCredential = credentialRecord ? getCredentialMainInfo(credentialRecord) : undefined
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
        const didcommConnection = await agent.connections.getById(connectionId)
        const chatThreadId = findOrCreateThread({ connection: didcommConnection }).id
        // Create chat entry
        const chatEntry = createChatEntry(realm, {
          associatedRecordId: '',
          chatThreadId,
          type: ChatEntryType.VPResponse,
          role: ChatEntryRole.Sender,
          state: ChatEntryState.Created,
          createdAt: new Date().getTime(),
          metadata: {
            proofState: ProofState.ProposalSent,
            presentedCredentials: JSON.stringify([presentedCredential]),
          },
        })
        addAgentActionToQueue({
          type: AgentActionType.PresentCredential,
          chatEntryId: chatEntry.id,
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
