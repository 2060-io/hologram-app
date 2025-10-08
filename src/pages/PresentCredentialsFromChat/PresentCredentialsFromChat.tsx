import { ProofState, W3cCredentialRepository } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Credentials } from '@2060/components'
import { PersonalChatStackParams } from '@2060/components/Navigation/NavigationProps'
import { AgentActionType, useChats, useMobileAgent } from '@2060/hooks/agent'
import { AnoncredsAttribute } from '@2060/hooks/agent/actions/AgentActionExecuter'
import { createChatEntry } from '@2060/hooks/agent/chat/services'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryRole, ChatEntryState, ChatEntryType, VPResponseMetadata } from '@2060/model'
import { getCredentialDetailsForDisplay, getCredentialMainInfo } from '@2060/services/agent/display'
import { formatCredentialSubject } from '@2060/services/agent/formatCredentialSubject'
import { toast } from '@2060/utils/toast'

interface Props extends StackScreenProps<PersonalChatStackParams, 'PresentCredentialsFromChat'> {}

const PresentCredentialsFromChat = ({ navigation, route }: Props) => {
  const { connectionId } = route.params
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const { findOrCreateThread } = useChats()

  const presentCredential = useCallback(async (credentialRecordId: string) => {
    if (!agent || !realm) return
    const credentialRecord = await agent.dependencyManager
      .resolve(W3cCredentialRepository)
      .findById(agent.context, credentialRecordId)
    if (!credentialRecord) return
    const mainInfo = getCredentialMainInfo(credentialRecord)
    const credentialDefinitionId = credentialRecord.getTag('anonCredsCredentialDefinitionId') as string
    if (!credentialDefinitionId) return
    const credentialDetails = credentialRecord ? getCredentialDetailsForDisplay(credentialRecord) : undefined
    const anoncredsAttributes: AnoncredsAttribute[] = []
    const detailsSections = credentialDetails
      ? formatCredentialSubject({ subject: credentialDetails.attributes, sanitizeKey: false })
      : []
    detailsSections.forEach(section => {
      section.rows.forEach(row => {
        anoncredsAttributes.push({ name: row.key, credentialDefinitionId })
      })
    })
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
    toast({
      type: 'success',
      message: t('credential.presented'),
    })
    navigation.goBack()
  }, [])

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Credentials
        navigation={navigation}
        headerTitle={t('credential.present')}
        onPressCredential={presentCredential}
      />
    </SafeAreaView>
  )
}

export default PresentCredentialsFromChat
