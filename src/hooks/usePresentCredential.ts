import { W3cCredentialRepository } from '@credo-ts/core'
import { DidCommProofState } from '@credo-ts/didcomm'
import { StackNavigationProp } from '@react-navigation/stack'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType, useChats, useMobileAgent, useAgentActionQueue } from '@2060/hooks/agent'
import { AnoncredsAttribute, PresentCredentialParameters } from '@2060/hooks/agent/actions/types'
import { createChatEntry } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType, VPResponseMetadata } from '@2060/model'
import { getCredentialMainInfo } from '@2060/services/agent/display'
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
      attributesToPresent: string[],
      navigation: StackNavigationProp<NavigationStackParams>,
    ) => {
      if (!agent || !realm) return
      const credentialRecord = await agent.dependencyManager
        .resolve(W3cCredentialRepository)
        .findById(agent.context, credentialRecordId)
      if (!credentialRecord) return
      const mainInfo = getCredentialMainInfo(credentialRecord)
      const credentialDefinitionId = credentialRecord.getTag('anonCredsCredentialDefinitionId') as string
      if (!credentialDefinitionId) return
      const anoncredsAttributes: AnoncredsAttribute[] = []
      attributesToPresent.forEach(attribute => {
        anoncredsAttributes.push({ name: attribute, credentialDefinitionId })
      })
      connectionsId.forEach(async connectionId => {
        const didcommConnection = await agent.didcomm.connections.getById(connectionId)
        const chatThreadId = findOrCreateThread({ connection: didcommConnection }).id
        const metadata: VPResponseMetadata = {
          proofState: DidCommProofState.ProposalSent,
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
        const parameters: PresentCredentialParameters = { anoncredsAttributes, connectionId }
        addAgentActionToQueue({
          type: AgentActionType.PresentCredential,
          chatEntryId: chatEntry.id,
          parameters,
        })
      })
      toast({
        type: 'success',
        message: t('credential.presented'),
      })
      // Go back two screens back to leave it on the screen where started flow
      navigation.pop(2)
    },
    [],
  )

  return { present }
}
