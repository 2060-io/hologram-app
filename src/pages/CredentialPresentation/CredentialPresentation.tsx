import { DidCommProofState } from '@credo-ts/didcomm'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'

import BaseCredentialPresentation from './BaseCredentialPresentation'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntry, ChatEntryType, VPResponseMetadata, VPResponsePresentedCredential } from '@2060/model'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialPresentation'> {}

const CredentialPresentation = ({ navigation, route }: Props) => {
  const {
    chatEntryId,
    proofRecordId,
    credentialAttributes: initCredentialAttributes,
    credentialMainInfo,
  } = route.params
  const { realm } = useLocalRealm()
  const [credentialAttributes, setCredentialAttributes] = useState(initCredentialAttributes)
  const [proofState, setProofState] = useState<ProofState>(route.params.proofState)

  useEffect(() => {
    const chatEntry = realm?.objects(ChatEntry).filtered(`id = '${chatEntryId}'`)
    const onChatEntryChange: Realm.CollectionChangeCallback<ChatEntry> = (_, changes) => {
      const { newModifications } = changes
      if (newModifications.length) {
        if (chatEntry && chatEntry[0].metadata) {
          const { presentedCredentials: pc, proofState: ps } = chatEntry[0].metadata as VPResponseMetadata
          const presentedCredentials: VPResponsePresentedCredential[] = pc ? JSON.parse(pc) : []
          setProofState(ps)
          if (presentedCredentials[0].attributes) {
            setCredentialAttributes(presentedCredentials[0].attributes)
          }
        }
      }
    }
    chatEntry?.addListener(onChatEntryChange)
    return () => {
      chatEntry?.removeListener(onChatEntryChange)
    }
  }, [])

  const updateChatEntryMetadataIfNecessary = (newProofState: DidCommProofState) => {
    if (realm) {
      const [chatEntry] = findAllByAssociatedRecordId(realm, proofRecordId, ChatEntryType.VPResponse)
      if (chatEntry) {
        const newMetadata = { ...chatEntry.metadata, proofState: newProofState }
        updateChatEntryMetadata(realm, chatEntry.id, newMetadata)
      }
    }
  }

  const onAcceptCallback = () => {
    updateChatEntryMetadataIfNecessary(DidCommProofState.RequestSent)
    navigation.goBack()
  }

  const onRefuseCallback = () => {
    updateChatEntryMetadataIfNecessary(DidCommProofState.Abandoned)
    navigation.goBack()
  }

  return (
    <BaseCredentialPresentation
      navigation={navigation}
      proofState={proofState}
      credentialMainInfo={credentialMainInfo}
      credentialAttributes={credentialAttributes}
      proofRecordId={proofRecordId}
      onAcceptCallback={onAcceptCallback}
      onRefuseCallback={onRefuseCallback}
    />
  )
}

export default CredentialPresentation
