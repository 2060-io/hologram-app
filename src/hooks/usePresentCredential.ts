import { ProofState, W3cCredentialRepository } from '@credo-ts/core'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { AgentActionType, useChats, useMobileAgent } from '@2060/hooks/agent'
import { AnoncredsAttribute } from '@2060/hooks/agent/actions/AgentActionExecuter'
import { createChatEntry } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType, VPResponseMetadata } from '@2060/model'
import { getCredentialDetailsForDisplay, getCredentialMainInfo } from '@2060/services/agent/display'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'
import { toast } from '@2060/utils/toast'

export const usePresentCredential = () => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { findOrCreateThread } = useChats()

  const present = useCallback(
    async (
      credentialRecordId: string,
      connectionsId: string[],
      navigation: StackNavigationProp<ParamListBase>,
    ) => {
      if (!agent || !realm) return
      const credentialRecord = await agent.dependencyManager
        .resolve(W3cCredentialRepository)
        .findById(agent.context, credentialRecordId)
      if (!credentialRecord) return
      const mainInfo = getCredentialMainInfo(credentialRecord)
      const credentialDefinitionId = credentialRecord.getTag('anonCredsCredentialDefinitionId') as string
      if (!credentialDefinitionId) return
      const credentialDetails = getCredentialDetailsForDisplay(credentialRecord)
      const anoncredsAttributes: AnoncredsAttribute[] = []
      const detailsSections = formatCredentialSubject({ subject: credentialDetails.attributes })
      detailsSections.forEach(section => {
        section.rows.forEach(row => {
          anoncredsAttributes.push({ name: row.key, credentialDefinitionId })
        })
      })
      connectionsId.forEach(async connectionId => {
        const didcommConnection = await agent.connections.getById(connectionId)
        const chatThreadId = findOrCreateThread({ connection: didcommConnection }).id
        const metadata: VPResponseMetadata = {
          proofState: ProofState.ProposalSent,
          presentedCredentials: JSON.stringify([{ mainInfo }]),
        }
        const chatEntry = createChatEntry(realm, {
          associatedRecordId: '',
          chatThreadId,
          type: ChatEntryType.VPResponse,
          role: ChatEntryRole.Sender,
          state: ChatEntryState.Created,
          createdAt: new Date().getTime(),
          metadata,
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
    [],
  )

  return { present }
}
