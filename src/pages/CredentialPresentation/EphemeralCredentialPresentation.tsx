import { ProofEventTypes, ProofState, ProofStateChangedEvent } from '@credo-ts/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import { filter, Subscription } from 'rxjs'

import BaseCredentialPresentation from './BaseCredentialPresentation'
import getStyles from './styles'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useMobileAgent } from '@2060/hooks/agent'
import { deleteConnection } from '@2060/hooks/agent/connections'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialMainInfo } from '@2060/services/agent/display'
import {
  getCredentialRevealedAttributes,
  proposalGetCredentialAttributes,
  proposalGetCredentialInfo,
} from '@2060/services/agent/proofs'
import { log } from '@2060/utils'

interface Props extends StackScreenProps<NavigationStackParams, 'EphemeralCredentialPresentation'> {}

const EphemeralCredentialPresentation = ({ navigation, route }: Props) => {
  const { proofRecordId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const [proofState, setProofState] = useState(ProofState.ProposalReceived)
  const [credentialAttributes, setCredentialAttributes] = useState({})
  const [credentialMainInfo, setCredentialMainInfo] = useState<CredentialMainInfo | null>(null)
  const observableOfProofStateChangedEvent = useRef<Subscription>(undefined)
  const connectionId = useRef<string>(undefined)

  useEffect(() => {
    const getCredentialInfo = async () => {
      if (!agent) return
      const info = await proposalGetCredentialInfo({ agent, proofRecordId })
      setCredentialMainInfo(info)
    }
    const getCredentialAttributes = async () => {
      if (!agent) return
      const attributes = await proposalGetCredentialAttributes({
        agent,
        proofRecordId,
      })
      setCredentialAttributes(attributes)
    }
    getCredentialInfo()
    getCredentialAttributes()
  }, [])

  useEffect(() => {
    const subscribeToProofStateChangedEvent = () => {
      const observableOfProofStateChanged = agent?.events
        .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
        .pipe(
          filter(
            event =>
              event.payload.proofRecord.id === proofRecordId &&
              [ProofState.RequestSent, ProofState.PresentationReceived, ProofState.Done].includes(
                event.payload.proofRecord.state,
              ),
          ),
        )
      observableOfProofStateChangedEvent.current = observableOfProofStateChanged?.subscribe(async event => {
        const { proofRecord } = event.payload
        setProofState(proofRecord.state)
        connectionId.current = proofRecord.connectionId
      })
    }
    subscribeToProofStateChangedEvent()
    return () => {
      observableOfProofStateChangedEvent.current?.unsubscribe()
    }
  }, [agent])

  useEffect(() => {
    const handleProofRecordStateChanged = async () => {
      if (proofState === ProofState.PresentationReceived && agent) {
        const revealedAttributes = await getCredentialRevealedAttributes({ agent, proofRecordId })
        setCredentialAttributes(revealedAttributes)
      }
      if (proofState === ProofState.Done && agent) {
        observableOfProofStateChangedEvent.current?.unsubscribe()
        if (agent && connectionId.current) {
          log(`Deleting ephemeral connection: ${connectionId.current}`)
          const connection = await agent.connections.getById(connectionId.current)
          deleteConnection(agent, connection)
        }
      }
    }
    handleProofRecordStateChanged()
  }, [agent, proofState])

  useEffect(() => {
    if (proofState !== ProofState.ProposalReceived) {
      navigation.setOptions({
        headerLeft: () => null,
        headerRight: () => (
          <TouchableOpacity style={styles.headerRight} onPress={() => navigation.goBack()}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.done')}
            </Text>
          </TouchableOpacity>
        ),
      })
    }
  }, [proofState])

  return (
    <BaseCredentialPresentation
      proofRecordId={proofRecordId}
      credentialMainInfo={credentialMainInfo}
      credentialAttributes={credentialAttributes}
      proofState={proofState}
      navigation={navigation}
    />
  )
}

export default EphemeralCredentialPresentation
