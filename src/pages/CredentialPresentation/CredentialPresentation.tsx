import { ProofState } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'

import BaseCredentialPresentation from './BaseCredentialPresentation'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { findAllByAssociatedRecordId, updateChatEntryMetadata } from '@2060/hooks/agent/chat/services'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntryType } from '@2060/model'

interface Props extends StackScreenProps<NavigationStackParams, 'CredentialPresentation'> {}

const CredentialPresentation = ({ navigation, route }: Props) => {
  const { proofRecordId } = route.params
  const { realm } = useLocalRealm()

  const updateChatEntryMetadataIfNecessary = (newProofState: ProofState) => {
    if (realm) {
      const [chatEntry] = findAllByAssociatedRecordId(realm, proofRecordId, ChatEntryType.VPResponse)
      if (chatEntry) {
        const newMetadata = { ...chatEntry.metadata, proofState: newProofState }
        updateChatEntryMetadata(realm, chatEntry.id, newMetadata)
      }
    }
  }

  const onAcceptCallback = () => {
    updateChatEntryMetadataIfNecessary(ProofState.RequestSent)
    navigation.goBack()
  }

  const onRefuseCallback = () => {
    updateChatEntryMetadataIfNecessary(ProofState.Abandoned)
  }

  return (
    <BaseCredentialPresentation
      {...route.params}
      navigation={navigation}
      onAcceptCallback={onAcceptCallback}
      onRefuseCallback={onRefuseCallback}
    />
  )
}

export default CredentialPresentation
