import { DidCommProofEventTypes, DidCommProofState, DidCommProofStateChangedEvent } from '@credo-ts/didcomm'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import { filter, Subscription } from 'rxjs'

import BaseCredentialPresentation from './BaseCredentialPresentation'
import getStyles from './styles'

import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { Text } from '@src/components/common'
import { useMobileAgent } from '@src/hooks/agent'
import { ProofSendProblemReportDescription } from '@src/hooks/agent/actions/types'
import { deleteConnection } from '@src/hooks/agent/connections'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { CredentialMainInfo } from '@src/services/agent/display'
import {
  getCredentialRevealedAttributes,
  proposalGetCredentialAttributes,
  proposalGetCredentialInfo,
} from '@src/services/agent/proofs'
import { log } from '@src/utils'
import { toast } from '@src/utils/toast'

type Props = StackScreenProps<NavigationStackParams, 'EphemeralCredentialPresentation'>

const EphemeralCredentialPresentation = ({ navigation, route }: Props) => {
  const { proofRecordId } = route.params
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { agent } = useMobileAgent()
  const [proofState, setProofState] = useState(DidCommProofState.ProposalReceived)
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
        .observable<DidCommProofStateChangedEvent>(DidCommProofEventTypes.ProofStateChanged)
        .pipe(
          filter(
            event =>
              event.payload.proofRecord.id === proofRecordId &&
              [
                DidCommProofState.RequestSent,
                DidCommProofState.PresentationReceived,
                DidCommProofState.Done,
                DidCommProofState.Abandoned,
              ].includes(event.payload.proofRecord.state),
          ),
        )
      observableOfProofStateChangedEvent.current = observableOfProofStateChanged?.subscribe(async event => {
        const { proofRecord } = event.payload
        setProofState(proofRecord.state)
        connectionId.current = proofRecord.connectionId
        if (proofRecord.state === DidCommProofState.PresentationReceived && agent) {
          const revealedAttributes = await getCredentialRevealedAttributes({ agent, proofRecordId })
          setCredentialAttributes(revealedAttributes)
        }
        if (
          proofRecord.state === DidCommProofState.Done ||
          proofRecord.state === DidCommProofState.Abandoned
        ) {
          removeObservableOfProofStateChangedEvent()
          if (proofRecord.state === DidCommProofState.Abandoned) {
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
      const connection = await agent.didcomm.connections.getById(connectionId.current)
      deleteConnection(agent, connection)
    }
    if (agent) {
      log(`Deleting proof record: ${proofRecordId}`)
      agent.didcomm.proofs.deleteById(proofRecordId)
    }
  }

  useEffect(() => {
    if (proofState !== DidCommProofState.ProposalReceived) {
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
