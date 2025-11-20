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
import { ProofSendProblemReportDescription } from '@2060/hooks/agent/actions/types'
import { deleteConnection } from '@2060/hooks/agent/connections'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { CredentialMainInfo } from '@2060/services/agent/display'
import {
  getCredentialRevealedAttributes,
  proposalGetCredentialAttributes,
  proposalGetCredentialInfo,
} from '@2060/services/agent/proofs'
import { log } from '@2060/utils'
import { toast } from '@2060/utils/toast'

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
              [
                ProofState.RequestSent,
                ProofState.PresentationReceived,
                ProofState.Done,
                ProofState.Abandoned,
              ].includes(event.payload.proofRecord.state),
          ),
        )
      observableOfProofStateChangedEvent.current = observableOfProofStateChanged?.subscribe(async event => {
        const { proofRecord } = event.payload
        setProofState(proofRecord.state)
        connectionId.current = proofRecord.connectionId
        if (proofRecord.state === ProofState.PresentationReceived && agent) {
          const revealedAttributes = await getCredentialRevealedAttributes({ agent, proofRecordId })
          setCredentialAttributes(revealedAttributes)
        }
        if (proofRecord.state === ProofState.Done || proofRecord.state === ProofState.Abandoned) {
          removeObservableOfProofStateChangedEvent()
          if (proofRecord.state === ProofState.Abandoned) {
            const isAbandonedDueNoResponse = proofRecord.errorMessage?.includes(
              ProofSendProblemReportDescription.TimeoutWaitingForResponse,
            )
            if (isAbandonedDueNoResponse) {
              toast({ type: 'error', message: t('credential.youDidNotResponseWithinTime'), duration: 5000 })
            }
          }
        }
      })
    }
    subscribeToProofStateChangedEvent()
    return () => {
      removeObservableOfProofStateChangedEvent()
      removeConnectionAndProofRecord()
    }
  }, [agent])

  const removeObservableOfProofStateChangedEvent = () => {
    log('removing observableOfProofStateChangedEvent')
    observableOfProofStateChangedEvent.current?.unsubscribe()
  }

  const removeConnectionAndProofRecord = async () => {
    if (agent && connectionId.current) {
      log(`Deleting ephemeral connection: ${connectionId.current}`)
      const connection = await agent.connections.getById(connectionId.current)
      deleteConnection(agent, connection)
    }
    if (agent) {
      log(`Deleting proof record: ${proofRecordId}`)
      agent.proofs.deleteById(proofRecordId)
    }
  }

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
