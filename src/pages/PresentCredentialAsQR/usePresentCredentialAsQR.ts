import {
  DidCommShortenedUrlInvalidatedEvent,
  DidCommShortenedUrlReceivedEvent,
  DidCommShortenUrlEventTypes,
  DidCommShortenUrlRepository,
} from '@2060.io/credo-ts-didcomm-shorten-url'
import { ConnectionProfileUpdatedEvent, ProfileEventTypes } from '@2060.io/credo-ts-didcomm-user-profile'
import { AnonCredsPresentationPreviewAttribute } from '@credo-ts/anoncreds'
import {
  TypedArrayEncoder,
  Buffer,
  ProofStateChangedEvent,
  ProofEventTypes,
  ProofState,
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  DidExchangeState,
  ConnectionsApi,
  OutOfBandRecord,
  ConnectionRecord,
  W3cCredentialRecord,
} from '@credo-ts/core'
import { ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Config from 'react-native-config'
import { timeout, Subscription, catchError, filter, EMPTY } from 'rxjs'

import { AgentActionType, useCredentials, useMobileAgent, useAgentActionQueue } from '@2060/hooks/agent'
import {
  AcceptProofRequestParameters,
  ProofSendProblemReportDescription,
  ProofSendProblemReportParameters,
} from '@2060/hooks/agent/actions/types'
import { deleteConnection } from '@2060/hooks/agent/connections'
import { createInvitation } from '@2060/services/agent'
import { CredentialMainInfo, getCredentialMainInfo } from '@2060/services/agent/display'
import { createProofProposal } from '@2060/services/agent/proofs'
import { log, logError } from '@2060/utils'
import { getConnectionDisplayName, getConnectionDisplayPicture } from '@2060/utils/connectionUtils'
import { toast } from '@2060/utils/toast'

export type State =
  | 'creating'
  | 'created'
  | 'expiredShortenedUrl'
  | 'scanned'
  | 'approved'
  | 'rejected'
  | 'timeoutWaiting'

const SHORTENED_URL_VALIDITY_TIME = 120 // 2 minutes
const MAX_TIME_TO_WAIT_VERIFIER_RESPONSE = 120_000 // 2 minutes

export const usePresentCredentialAsQR = ({
  credentialRecordId,
  attributesToPresent,
  navigation,
}: {
  credentialRecordId: string
  attributesToPresent: string[]
  navigation: StackNavigationProp<ParamListBase>
}) => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { getCredentialById } = useCredentials()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [state, setState] = useState<State>('creating')
  const stateAux = useRef<State>('creating')
  const invitation = useRef<OutOfBandRecord>(undefined)
  const invitationUrl = useRef<string>(undefined)
  const proofRecordId = useRef<string>(undefined)
  const credentialRecord = useRef<W3cCredentialRecord>(undefined)
  const urlForQr = useRef<string>('')
  const shortenedUrl = useRef<string>(undefined)
  const shortenedUrlTimeout = useRef<NodeJS.Timeout>(undefined)
  const observableOfProofStateChangedEvent = useRef<Subscription>(undefined)
  const observableOfConnectionStateChangedEvent = useRef<Subscription>(undefined)
  const observableOfConnectionProfileUpdatedEventEvent = useRef<Subscription>(undefined)
  const ephemeralConnection = useRef<ConnectionRecord>(undefined)
  const defaultMediatorConnection = useRef<ConnectionRecord>(null)
  const [credentialPresentedInfo, setPresentedCredentialInfo] = useState<{
    credentials: CredentialMainInfo[]
    verifierName: string
    verifierPicture: string
  }>({ credentials: [], verifierName: '', verifierPicture: '' })

  useEffect(() => {
    createQRCode()
    return () => {
      removeConnectionAndProofRecord()
      clearShortenedUrlStatusValidator()
      invalidateCurrentShortenedUrl()
      removeDidCommShortenedUrlReceivedListener()
      removeDidCommShortenedUrlInvalidatedListener()
      removeObservableOfConnectionStateChangedEvent()
      removeObservableOfConnectionProfileUpdatedEvent()
      removeObservableOfProofStateChangedEvent()
    }
  }, [])

  useEffect(() => {
    stateAux.current = state
  }, [state])

  async function createQRCode() {
    try {
      if (!agent) return
      defaultMediatorConnection.current = await agent.mediationRecipient.findDefaultMediatorConnection()
      credentialRecord.current = getCredentialById(credentialRecordId)
      if (!credentialRecord.current) return
      const credentialDefinitionId = credentialRecord.current.getTag(
        'anonCredsCredentialDefinitionId',
      ) as string
      if (!credentialDefinitionId) return
      const attributes: AnonCredsPresentationPreviewAttribute[] = attributesToPresent.map(attribute => ({
        name: attribute,
        credentialDefinitionId,
      }))
      const proofProposal = await createProofProposal({ agent, attributes })
      proofRecordId.current = proofProposal.proofRecord.id
      invitation.current = await createInvitation(agent, {
        multiUseInvitation: false,
        messages: [proofProposal.message],
      })
      invitationUrl.current = invitation.current.outOfBandInvitation.toUrl({
        domain: Config.BASE_INVITATION_URL as string,
      })
      requestShortenedUrl()
    } catch (error) {
      navigation.pop(1)
      toast({ type: 'error', message: t('credential.errorCreatingQR') })
      logError('Error creating credential QR has occurred', error)
    }
  }

  function requestShortenedUrl() {
    if (!defaultMediatorConnection.current?.id || !invitationUrl.current) return
    log('Requesting shortened URL')
    agent?.modules.shortenUrl.requestShortenedUrl({
      connectionId: defaultMediatorConnection.current.id,
      url: invitationUrl.current,
      goalCode: 'share_link',
      requestedValiditySeconds: SHORTENED_URL_VALIDITY_TIME,
    })
    agent?.events.on<DidCommShortenedUrlReceivedEvent>(
      DidCommShortenUrlEventTypes.DidCommShortenedUrlReceived,
      onDidCommShortenedUrlReceived,
    )
  }

  function onDidCommShortenedUrlReceived(event: DidCommShortenedUrlReceivedEvent) {
    log('DidCommShortenedUrlReceivedEvent received', event)
    const { shortenUrlRecord } = event.payload
    const shortenedUrlToBase64 = TypedArrayEncoder.toBase64URL(Buffer.from(shortenUrlRecord.shortenedUrl!))
    shortenedUrl.current = shortenUrlRecord.shortenedUrl
    urlForQr.current = `${Config.BASE_INVITATION_URL}?_url=${shortenedUrlToBase64}`
    setState('created')
    removeDidCommShortenedUrlReceivedListener()
    subscribeToConnectionStateChangedEvent()
    shortenedUrlTimeout.current = setTimeout(validateShortenedUrlStatus, SHORTENED_URL_VALIDITY_TIME * 1000)
  }

  function refreshQRCode() {
    setState('creating')
    invalidateCurrentShortenedUrl()
    agent?.events.on<DidCommShortenedUrlInvalidatedEvent>(
      DidCommShortenUrlEventTypes.DidCommShortenedUrlInvalidated,
      onDidCommShortenedUrlInvalidated,
    )
  }

  async function invalidateCurrentShortenedUrl() {
    if (!agent) return
    if (shortenedUrl.current) {
      const shortenUrlRepository = agent.dependencyManager.resolve(DidCommShortenUrlRepository)
      const record = await shortenUrlRepository.getSingleByQuery(agent.context, {
        shortenedUrl: shortenedUrl.current,
      })
      log('Invalidating ShortenedUrl for record id', record.id)
      agent.modules.shortenUrl.invalidateShortenedUrl({ recordId: record.id })
      shortenedUrl.current = undefined
    }
  }

  function onDidCommShortenedUrlInvalidated(event: DidCommShortenedUrlInvalidatedEvent) {
    log('DidCommShortenedUrlInvalidatedEvent', event)
    removeDidCommShortenedUrlInvalidatedListener()
    requestShortenedUrl()
    if (agent) {
      const shortenUrlRepository = agent.dependencyManager.resolve(DidCommShortenUrlRepository)
      shortenUrlRepository.deleteById(agent.context, event.payload.shortenUrlRecord.id)
    }
  }

  function validateShortenedUrlStatus() {
    const hasNotBeenScanned = stateAux.current === 'created'
    if (hasNotBeenScanned) {
      setState('expiredShortenedUrl')
      removeDidCommShortenedUrlReceivedListener()
      removeObservableOfConnectionStateChangedEvent()
    }
  }

  function subscribeToConnectionStateChangedEvent() {
    const observableOfConnectionStateChanged = agent?.events
      .observable<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged)
      .pipe(
        filter(
          event =>
            event.payload.connectionRecord.outOfBandId === invitation.current?.id &&
            event.payload.connectionRecord.state === DidExchangeState.RequestReceived,
        ),
      )
    observableOfConnectionStateChangedEvent.current = observableOfConnectionStateChanged?.subscribe(
      async event => {
        const { connectionRecord } = event.payload
        setState('scanned')
        clearShortenedUrlStatusValidator()
        invalidateCurrentShortenedUrl()
        removeObservableOfConnectionStateChangedEvent()
        subscribeToConnectionProfileUpdatedEvent(connectionRecord.id)
        subscribeToProofStateChangedEvent(connectionRecord)
        ephemeralConnection.current = connectionRecord
        const connectionsApi = agent?.dependencyManager.resolve(ConnectionsApi)
        connectionsApi?.addConnectionType(connectionRecord.id, 'Ephemeral')
        if (proofRecordId.current && agent) {
          const proofRecord = await agent.proofs.getById(proofRecordId.current)
          proofRecord.connectionId = connectionRecord.id
          await agent?.proofs.update(proofRecord)
        }
      },
    )
  }

  function subscribeToConnectionProfileUpdatedEvent(connectionId: string) {
    const observableOfConnectionProfileUpdatedEvent = agent?.events
      .observable<ConnectionProfileUpdatedEvent>(ProfileEventTypes.ConnectionProfileUpdated)
      .pipe(filter(event => event.payload.connection.id === connectionId))

    observableOfConnectionProfileUpdatedEventEvent.current =
      observableOfConnectionProfileUpdatedEvent?.subscribe(event => {
        const { connection } = event.payload
        const verifierName = getConnectionDisplayName(connection)
        const verifierPicture = getConnectionDisplayPicture(connection)
        setPresentedCredentialInfo(prevState => ({
          ...prevState,
          verifierName,
          verifierPicture,
        }))
        removeObservableOfConnectionProfileUpdatedEvent()
      })
  }

  const onObservableOfProofStateChangedTimeout = () => {
    const hasNotReceivedResponseFromVerifier = stateAux.current === 'scanned'
    if (hasNotReceivedResponseFromVerifier) {
      setState('timeoutWaiting')
      if (proofRecordId.current) {
        const parameters: ProofSendProblemReportParameters = {
          proofRecordId: proofRecordId.current,
          description: ProofSendProblemReportDescription.TimeoutWaitingForResponse,
        }
        addAgentActionToQueue({ type: AgentActionType.ProofSendProblemReport, parameters })
      }
    }
    return EMPTY
  }

  function subscribeToProofStateChangedEvent(connection: ConnectionRecord) {
    const observableOfProofStateChanged = agent?.events
      .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
      .pipe(
        filter(
          event =>
            event.payload.proofRecord.connectionId === connection.id &&
            [ProofState.RequestReceived, ProofState.Abandoned, ProofState.Done].includes(
              event.payload.proofRecord.state,
            ),
        ),
        timeout(MAX_TIME_TO_WAIT_VERIFIER_RESPONSE),
        catchError(onObservableOfProofStateChangedTimeout),
      )

    observableOfProofStateChangedEvent.current = observableOfProofStateChanged?.subscribe(async event => {
      const { proofRecord } = event.payload
      switch (proofRecord.state) {
        case ProofState.RequestReceived: {
          setState('approved')
          const parameters: AcceptProofRequestParameters = { proofRecordId: proofRecord.id }
          addAgentActionToQueue({ type: AgentActionType.AcceptProofRequest, parameters })
          const presentedCredential = getCredentialMainInfo(credentialRecord.current!)
          setPresentedCredentialInfo(prevState => ({
            ...prevState,
            credentials: [presentedCredential],
          }))
          break
        }
        case ProofState.Abandoned: {
          setState('rejected')
          const presentedCredential = getCredentialMainInfo(credentialRecord.current!)
          setPresentedCredentialInfo(prevState => ({
            ...prevState,
            credentials: [presentedCredential],
          }))
          removeObservableOfProofStateChangedEvent()
          break
        }
        case ProofState.Done:
          removeObservableOfProofStateChangedEvent()
          break
        default:
          break
      }
    })
  }

  function removeConnectionAndProofRecord() {
    if (!agent) return
    if (ephemeralConnection.current) {
      log(`Deleting ephemeral connection: ${ephemeralConnection.current.id}`)
      deleteConnection(agent, ephemeralConnection.current, addAgentActionToQueue)
      ephemeralConnection.current = undefined
    }
    if (proofRecordId.current) {
      log(`Deleting proof record: ${proofRecordId.current}`)
      agent.proofs.deleteById(proofRecordId.current)
    }
  }

  function clearShortenedUrlStatusValidator() {
    clearTimeout(shortenedUrlTimeout.current)
  }

  function removeDidCommShortenedUrlReceivedListener() {
    log('removing DidCommShortenedUrlReceivedEvent')
    agent?.events.off<DidCommShortenedUrlReceivedEvent>(
      DidCommShortenUrlEventTypes.DidCommShortenedUrlReceived,
      onDidCommShortenedUrlReceived,
    )
  }

  function removeDidCommShortenedUrlInvalidatedListener() {
    log('removing DidCommShortenedUrlInvalidatedEvent')
    agent?.events.off<DidCommShortenedUrlInvalidatedEvent>(
      DidCommShortenUrlEventTypes.DidCommShortenedUrlInvalidated,
      onDidCommShortenedUrlInvalidated,
    )
  }

  function removeObservableOfConnectionStateChangedEvent() {
    log('removing observableOfConnectionStateChangedEvent')
    observableOfConnectionStateChangedEvent.current?.unsubscribe()
  }

  function removeObservableOfProofStateChangedEvent() {
    log('removing observableOfProofStateChangedEvent')
    observableOfProofStateChangedEvent.current?.unsubscribe()
  }

  function removeObservableOfConnectionProfileUpdatedEvent() {
    log('removing observableOfConnectionProfileUpdatedEvent')
    observableOfConnectionProfileUpdatedEventEvent.current?.unsubscribe()
  }

  return {
    state,
    urlForQr: urlForQr.current,
    credentialPresentedInfo,
    refreshQRCode,
  }
}
