import {
  DidCommShortenedUrlReceivedEvent,
  DidCommShortenUrlEventTypes,
} from '@2060.io/credo-ts-didcomm-shorten-url'
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
} from '@credo-ts/core'
import { useEffect, useRef, useState } from 'react'
import Config from 'react-native-config'
import { timeout, Subscription, catchError, filter } from 'rxjs'

import { AgentActionType, useCredentials, useMobileAgent } from '@2060/hooks/agent'
import { AcceptProofRequestParameters } from '@2060/hooks/agent/actions/types'
import { deleteConnection } from '@2060/hooks/agent/connections'
import { useAgentActionQueue } from '@2060/hooks/agent/useAgentActionQueue'
import { createInvitation } from '@2060/services/agent'
import { createProofProposal } from '@2060/services/agent/proofs'
import { log, logError } from '@2060/utils'

export type State =
  | 'creating'
  | 'created'
  | 'errorCreating'
  | 'scanned'
  | 'approved'
  | 'rejected'
  | 'timeoutWaiting'

export const usePresentCredentialAsQR = ({
  credentialRecordId,
  attributesToPresent,
}: {
  credentialRecordId: string
  attributesToPresent: string[]
}) => {
  const { agent } = useMobileAgent()
  const { getCredentialById } = useCredentials()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [state, setState] = useState<State>('creating')
  const urlForQr = useRef<string>('')
  const shortenedUrl = useRef<string>(undefined)
  const observableOfProofStateChangedEvent = useRef<Subscription>(undefined)
  const observableOfConnectionStateChangedEvent = useRef<Subscription>(undefined)
  const ephemeralConnection = useRef<ConnectionRecord>(undefined)
  const defaultMediatorConnection = useRef<ConnectionRecord>(null)

  useEffect(() => {
    let invitation: OutOfBandRecord
    const startFlow = async () => {
      try {
        if (!agent) return
        defaultMediatorConnection.current = await agent.mediationRecipient.findDefaultMediatorConnection()
        if (!defaultMediatorConnection.current) return
        const credentialRecord = getCredentialById(credentialRecordId)
        if (!credentialRecord) return
        const credentialDefinitionId = credentialRecord.getTag('anonCredsCredentialDefinitionId') as string
        if (!credentialDefinitionId) return
        const attributes: AnonCredsPresentationPreviewAttribute[] = attributesToPresent.map(attribute => ({
          name: attribute,
          credentialDefinitionId,
        }))
        const proofProposal = await createProofProposal({ agent, attributes })
        invitation = await createInvitation(agent, {
          multiUseInvitation: false,
          messages: [proofProposal.message],
        })
        const url = invitation.outOfBandInvitation.toUrl({
          domain: Config.BASE_INVITATION_URL as string,
        })
        agent.modules.shortenUrl.requestShortenedUrl({
          connectionId: defaultMediatorConnection.current.id,
          url,
          goalCode: 'share_link',
          requestedValiditySeconds: 120,
        })
        agent.events.on<DidCommShortenedUrlReceivedEvent>(
          DidCommShortenUrlEventTypes.DidCommShortenedUrlReceived,
          didCommShortenedUrlReceivedListener,
        )
      } catch (error) {
        setState('errorCreating')
        logError('Error creating credential QR has occurred', error)
      }
    }
    startFlow()

    const didCommShortenedUrlReceivedListener = (event: DidCommShortenedUrlReceivedEvent) => {
      const shortenedUrlToBase64 = TypedArrayEncoder.toBase64URL(Buffer.from(event.payload.shortenedUrl))
      shortenedUrl.current = event.payload.shortenedUrl
      urlForQr.current = `${Config.BASE_INVITATION_URL}?_url=${shortenedUrlToBase64}`
      setState('created')
      removeDidCommShortenedUrlReceivedListener()
      subscribeToConnectionStateChangedEvent()
    }

    const subscribeToConnectionStateChangedEvent = () => {
      const observableOfConnectionStateChanged = agent?.events
        .observable<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged)
        .pipe(
          filter(
            event =>
              event.payload.connectionRecord.outOfBandId === invitation.id &&
              event.payload.connectionRecord.state === DidExchangeState.RequestReceived,
          ),
        )
      observableOfConnectionStateChangedEvent.current = observableOfConnectionStateChanged?.subscribe(
        async event => {
          const { connectionRecord } = event.payload
          setState('scanned')
          invalidateShortenedUrl()
          invalidateObservableOfConnectionStateChangedEvent()
          subscribeToProofStateChangedEvent(connectionRecord)
          ephemeralConnection.current = connectionRecord
          const connectionsApi = agent?.dependencyManager.resolve(ConnectionsApi)
          connectionsApi?.addConnectionType(connectionRecord.id, 'Ephemeral')
        },
      )
    }

    const subscribeToProofStateChangedEvent = (connection: ConnectionRecord) => {
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
          timeout(120_000),
          catchError(() => {
            setState('timeoutWaiting')
            throw new Error('proofStateChangedEventSubscription Error')
          }),
        )
      observableOfProofStateChangedEvent.current = observableOfProofStateChanged?.subscribe(async event => {
        const { proofRecord } = event.payload
        switch (proofRecord.state) {
          case ProofState.RequestReceived:
            setState('approved')
            const parameters: AcceptProofRequestParameters = { proofRecordId: proofRecord.id }
            addAgentActionToQueue({ type: AgentActionType.AcceptProofRequest, parameters })
            break
          case ProofState.Abandoned:
            setState('rejected')
            break
          case ProofState.Done:
            invalidateObservableOfProofStateChangedEvent()
            removeConnection()
            break
          default:
            break
        }
      })
    }
    const removeConnection = () => {
      if (!agent) return
      if (ephemeralConnection.current) {
        log(`Deleting ephemeral connection: ${ephemeralConnection.current.id}`)
        deleteConnection(agent, ephemeralConnection.current)
        ephemeralConnection.current = undefined
      }
    }

    const invalidateShortenedUrl = () => {
      if (!agent) return
      if (shortenedUrl.current && defaultMediatorConnection.current) {
        const options = {
          connectionId: defaultMediatorConnection.current.id,
          shortenedUrl: shortenedUrl.current,
        }
        log('Invalidating ShortenedUrl:', JSON.stringify(options))
        agent.modules.shortenUrl.invalidateShortenedUrl(options)
        shortenedUrl.current = undefined
      }
    }

    const removeDidCommShortenedUrlReceivedListener = () => {
      agent?.events.off<DidCommShortenedUrlReceivedEvent>(
        DidCommShortenUrlEventTypes.DidCommShortenedUrlReceived,
        didCommShortenedUrlReceivedListener,
      )
    }

    const invalidateObservableOfConnectionStateChangedEvent = () => {
      observableOfConnectionStateChangedEvent.current?.unsubscribe()
    }

    const invalidateObservableOfProofStateChangedEvent = () => {
      observableOfProofStateChangedEvent.current?.unsubscribe()
    }

    return () => {
      removeDidCommShortenedUrlReceivedListener()
      invalidateShortenedUrl()
      invalidateObservableOfConnectionStateChangedEvent()
      invalidateObservableOfProofStateChangedEvent()
      removeConnection()
    }
  }, [agent])

  return { state, urlForQr: urlForQr.current }
}
