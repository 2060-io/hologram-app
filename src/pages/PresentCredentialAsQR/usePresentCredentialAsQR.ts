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
  const shortenedUrlForQr = useRef<string>(null)
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
          requestedValiditySeconds: 60,
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
      const urlForQr = `${Config.BASE_INVITATION_URL}?_url=${shortenedUrlToBase64}`
      shortenedUrlForQr.current = urlForQr
      setState('created')
      subscribeToConnectionStateChangedEvent()
      subscribeToProofStateChangedEvent()
    }

    const subscribeToConnectionStateChangedEvent = () => {
      const observableOfConnectionStateChanged = agent?.events
        .observable<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged)
        .pipe(filter(event => event.payload.connectionRecord.outOfBandId === invitation.id))
      observableOfConnectionStateChangedEvent.current = observableOfConnectionStateChanged?.subscribe(
        async event => {
          const { connectionRecord } = event.payload
          ephemeralConnection.current = connectionRecord
          if (connectionRecord.state === DidExchangeState.RequestReceived) {
            setState('scanned')
            if (connectionRecord.outOfBandId) {
              const connectionsApi = agent?.dependencyManager.resolve(ConnectionsApi)
              connectionsApi?.addConnectionType(connectionRecord.id, 'Ephemeral')
            }
          }
        },
      )
    }

    const subscribeToProofStateChangedEvent = () => {
      const observableOfProofStateChanged = agent?.events
        .observable<ProofStateChangedEvent>(ProofEventTypes.ProofStateChanged)
        .pipe(
          timeout(120_000),
          catchError(() => {
            setState('timeoutWaiting')
            throw new Error('proofStateChangedEventSubscription Error')
          }),
        )
      observableOfProofStateChangedEvent.current = observableOfProofStateChanged?.subscribe(async event => {
        const { payload } = event
        const { proofRecord } = payload
        const states: Partial<Record<ProofState, State>> = {
          [ProofState.ProposalReceived]: 'scanned',
          [ProofState.RequestReceived]: 'approved',
          [ProofState.Abandoned]: 'rejected',
        }
        const newState = states[proofRecord.state]
        if (newState) setState(newState)
        const acceptRequest =
          proofRecord.connectionId === ephemeralConnection.current?.id &&
          proofRecord.state === ProofState.RequestReceived
        if (acceptRequest) {
          const parameters: AcceptProofRequestParameters = { proofRecordId: proofRecord.id }
          addAgentActionToQueue({ type: AgentActionType.AcceptProofRequest, parameters })
        }
      })
    }

    return () => {
      if (!agent) return
      if (ephemeralConnection.current) {
        log(`Deleting ephemeral connection: ${ephemeralConnection.current.id}`)
        deleteConnection(agent, ephemeralConnection.current)
      }
      if (shortenedUrlForQr.current && defaultMediatorConnection.current) {
        const options = {
          connectionId: defaultMediatorConnection.current.id,
          shortenedUrl: shortenedUrlForQr.current,
        }
        log('Invalidating ShortenedUrl:', JSON.stringify(options))
        agent.modules.shortenUrl.invalidateShortenedUrl(options)
      }
      observableOfConnectionStateChangedEvent.current?.unsubscribe()
      observableOfProofStateChangedEvent.current?.unsubscribe()
      agent.events.off<DidCommShortenedUrlReceivedEvent>(
        DidCommShortenUrlEventTypes.DidCommShortenedUrlReceived,
        didCommShortenedUrlReceivedListener,
      )
    }
  }, [agent])

  return { state, urlForQr: shortenedUrlForQr.current ?? '' }
}
