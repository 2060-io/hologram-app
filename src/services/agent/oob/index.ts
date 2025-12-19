import { V1OfferCredentialMessage, DidCommRequestPresentationV1Message } from '@credo-ts/anoncreds'
import { EventEmitter, AgentContext, isDid, utils, tryParseDid } from '@credo-ts/core'
import {
  DidCommDocumentService,
  DidCommOutOfBandApi,
  DidCommConnectionRepository,
  DidCommRoutingService,
  DidCommConnectionsApi,
  DidCommConnectionRecord,
  DidCommOutOfBandInvitation,
  DidCommOutOfBandRecord,
  DidCommOutOfBandRepository,
  DidCommCredentialEventTypes,
  DidCommCredentialState,
  DidCommCredentialStateChangedEvent,
  DidCommOutOfBandState,
  DidCommProofEventTypes,
  DidCommProofState,
  DidCommProofStateChangedEvent,
  DidCommOfferCredentialV2Message,
  DidCommRequestPresentationV2Message,
  parseMessageType,
  DidCommMediationRecipientApi,
  CreateOutOfBandInvitationConfig,
  DidCommProposePresentationV2Message,
  supportsIncomingMessageType,
} from '@credo-ts/didcomm'
import { t } from 'i18next'
import { filter, firstValueFrom, merge, first, timeout } from 'rxjs'

import { MobileAgent } from '../MobileAgent'

import { OutOfBandInvitationEvent, OutOfBandInvitationEventTypes } from './OutOfBandEvents'

import { deleteConnection, findExistingConnection } from '@2060/hooks/agent/connections'
import { log, logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

export enum DidcommInvitationType {
  ConnectionRequest = 'connection-request',
  PresentationRequest = 'presentation-request',
  CredentialOffer = 'credential-offer',
  CredentialPresentation = 'credential-presentation',
}

/**
 * Gets the out of band record and connection associated to a given invitation. In case no
 * existing connection or out of band record are found, it will create a new one, in order to
 * let the invitation be accepted through a call to acceptInvitation
 *
 * @param agentContext
 * @param options
 * @returns
 */
export const getOutOfBandRecord = async (
  agentContext: AgentContext,
  options: {
    invitation: DidCommOutOfBandInvitation
  },
): Promise<{ outOfBandRecord: DidCommOutOfBandRecord; existingConnection?: DidCommConnectionRecord }> => {
  const { invitation } = options

  const outOfBandApi = agentContext.dependencyManager.resolve(DidCommOutOfBandApi)

  // Check that this is not an invitation created by us
  const ownInvitationRecord = await outOfBandApi.findByCreatedInvitationId(invitation.id)
  if (ownInvitationRecord) {
    throw new Error(t('invitation.errorConnectToSelf'))
  }
  // Check if there is a connection whose did is associated to the same id from the invitation
  const existingConnection = await findExistingConnection(agentContext, invitation)

  // Special case: this is a regular connection invitation and we are already connected: return the original
  // oob record and do not do any further processing
  const requests = invitation.getRequests()
  const requestMessage = requests && requests.length ? requests[0] : undefined
  if (existingConnection?.outOfBandId && !requestMessage) {
    const oobRecordFromExistingConnection = await outOfBandApi.findById(existingConnection.outOfBandId)
    if (oobRecordFromExistingConnection) {
      return { outOfBandRecord: oobRecordFromExistingConnection, existingConnection }
    }
  }

  // We check if OOB Record with the same invitation ID exists and return it if that's the case
  const existingOobRecord = await outOfBandApi.findByReceivedInvitationId(invitation.id)
  if (existingOobRecord) return { outOfBandRecord: existingOobRecord, existingConnection }

  // Special case: public DID invitation (e.g. forward connection): replace invitation id with
  // the did given on pthid
  const { outOfBandRecord } =
    invitation.thread?.parentThreadId && isDid(invitation.thread.parentThreadId)
      ? await outOfBandApi.receiveImplicitInvitation({
          did: invitation.thread.parentThreadId,
          label: invitation.label ?? '',
          imageUrl: invitation.imageUrl,
          autoAcceptInvitation: false,
          autoAcceptConnection: false,
        })
      : await outOfBandApi.receiveInvitation(invitation, {
          label: '',
          autoAcceptInvitation: false,
          autoAcceptConnection: false,
          reuseConnection: true,
        })

  return { outOfBandRecord, existingConnection }
}

type ProcessInvitationResult =
  | {
      success: true
      recordId: string
      existingConnectionId?: string
      invitationType: DidcommInvitationType
    }
  | {
      success: false
      error: string
    }
/**
 * Process a DIDComm invitation by assigning an out of band record to it. In case of regular connection
 * invitations, it will return specifying if there was already a connection associated to it.
 *
 * In case of Presentation Requests and Credential Offers, it will automatically accept the invitation in
 * order to process the request messages. Later on the user can actually accept or refuse the request
 * specifically. In these cases, we'll attempt to reuse any existing connection. In order for this to work,
 * both receiver and requester agents must be online. Otherwise, the flow will timeout and cancelled.
 *
 * @param agent
 * @param invitation
 * @returns
 */
export const processInvitation = async (
  agent: MobileAgent,
  invitation: DidCommOutOfBandInvitation,
): Promise<ProcessInvitationResult> => {
  try {
    const { outOfBandRecord, existingConnection } = await getOutOfBandRecord(agent.context, { invitation })
    if (outOfBandRecord.state !== DidCommOutOfBandState.Initial) {
      toast({ type: 'warning', message: t('invitation.alreadyScanned') })
    }

    const requests = invitation.getRequests()
    const requestMessage = requests && requests.length ? requests[0] : undefined

    // If it is simply a connection invitation, show it without further processing
    if (!requestMessage) {
      return {
        success: true,
        invitationType: DidcommInvitationType.ConnectionRequest,
        existingConnectionId: existingConnection?.id,
        recordId: outOfBandRecord.id,
      }
    }

    const parsedMessageType = parseMessageType(requestMessage['@type'])
    const isValidRequestMessage =
      supportsIncomingMessageType(parsedMessageType, V1OfferCredentialMessage.type) ||
      supportsIncomingMessageType(parsedMessageType, DidCommOfferCredentialV2Message.type) ||
      supportsIncomingMessageType(parsedMessageType, DidCommRequestPresentationV1Message.type) ||
      supportsIncomingMessageType(parsedMessageType, DidCommRequestPresentationV2Message.type) ||
      supportsIncomingMessageType(parsedMessageType, DidCommProposePresentationV2Message.type)

    if (!isValidRequestMessage) {
      throw new Error('Message request is not from supported protocol.')
    }

    // eslint-disable-next-line prefer-const
    let connectionId: string | undefined

    const credentialOffer = agent.events
      .observable<DidCommCredentialStateChangedEvent>(
        DidCommCredentialEventTypes.DidCommCredentialStateChanged,
      )
      .pipe(
        filter(
          event => event.payload.credentialExchangeRecord.state === DidCommCredentialState.OfferReceived,
        ),
        filter(event =>
          connectionId
            ? event.payload.credentialExchangeRecord.connectionId === connectionId
            : event.payload.credentialExchangeRecord.parentThreadId === invitation.id,
        ),
      )

    const proofRequest = agent.events
      .observable<DidCommProofStateChangedEvent>(DidCommProofEventTypes.ProofStateChanged)
      .pipe(
        filter(event =>
          [DidCommProofState.RequestReceived, DidCommProofState.ProposalReceived].includes(
            event.payload.proofRecord.state,
          ),
        ),
        filter(event =>
          connectionId
            ? event.payload.proofRecord.connectionId === connectionId
            : event.payload.proofRecord.parentThreadId === invitation.id,
        ),
      )

    const eventPromise = firstValueFrom(
      merge(credentialOffer, proofRequest).pipe(
        first(),
        // Wait up to 10 seconds to receive event: TODO add possibility of canceling the process
        timeout(10 * 1000),
      ),
    )
    const { connectionRecord } = await acceptInvitation(agent.context, { outOfBandId: outOfBandRecord.id })
    connectionId = connectionRecord?.id
    if (connectionRecord?.id) agent.didcomm.connections.addConnectionType(connectionRecord.id, 'Ephemeral')
    try {
      const event = await eventPromise
      if (event.type === DidCommCredentialEventTypes.DidCommCredentialStateChanged) {
        return {
          success: true,
          invitationType: DidcommInvitationType.CredentialOffer,
          existingConnectionId: existingConnection?.id,
          recordId: event.payload.credentialExchangeRecord.id,
        }
      } else if (event.type === DidCommProofEventTypes.ProofStateChanged) {
        if (event.payload.proofRecord.state === DidCommProofState.RequestReceived) {
          return {
            success: true,
            invitationType: DidcommInvitationType.PresentationRequest,
            existingConnectionId: existingConnection?.id,
            recordId: event.payload.proofRecord.id,
          }
        }
        return {
          success: true,
          invitationType: DidcommInvitationType.CredentialPresentation,
          existingConnectionId: existingConnection?.id,
          recordId: event.payload.proofRecord.id,
        }
      }
    } catch (error) {
      logError(`Error while waiting for credential offer or proof request. Deleting out of band record`)
      // Delete OOB record
      const outOfBandRepository = agent.dependencyManager.resolve(DidCommOutOfBandRepository)
      await outOfBandRepository.deleteById(agent.context, outOfBandRecord.id)

      // Delete connection record (only if it was created from this flow)
      if (!existingConnection && connectionRecord) {
        log(`Deleting connection`)
        await deleteConnection(agent, connectionRecord)
      }
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    }
  }

  return {
    success: false,
    error: 'Unknown error',
  }
}
export const createInvitation = async (
  agent: MobileAgent,
  config?: Partial<Omit<CreateOutOfBandInvitationConfig, 'routing'>>,
) => {
  const oobRecord = await agent.didcomm.oob.createInvitation({
    ...config,
    routing: await getMediationRouting(agent.context),
  })
  return oobRecord
}

export const getOutOfBandRecordById = async (agent: MobileAgent, outOfBandId: string) => {
  const oobRecord = await agent.didcomm.oob.getById(outOfBandId)
  return oobRecord
}

export const createOobInvitation = (connection: DidCommConnectionRecord) => {
  const jsonInvitation = {
    '@type': DidCommOutOfBandInvitation.type.messageTypeUri,
    '@id': utils.uuid(),
    label: connection.theirLabel,
    imageUrl: connection.imageUrl,
    services: [connection.invitationDid],
    handshake_protocols: [connection.protocol ?? 'https://didcomm.org/didexchange/1.0'],
    accept: ['didcomm/aip1', 'didcomm/aip2;env=rfc19'],
  }
  const outOfBandInvitation = DidCommOutOfBandInvitation.fromJson(jsonInvitation)
  outOfBandInvitation.setThread({ parentThreadId: connection.invitationDid })
  return outOfBandInvitation
}

export async function acceptInvitation(
  agentContext: AgentContext,
  options: { connectionId?: string; outOfBandId: string; label?: string },
) {
  const connectionsApi = agentContext.dependencyManager.resolve(DidCommConnectionsApi)
  const connection = options.connectionId ? await connectionsApi.findById(options.connectionId) : null

  const outOfBandApi = agentContext.dependencyManager.resolve(DidCommOutOfBandApi)
  const outOfBandRecord = await outOfBandApi.getById(options.outOfBandId)
  const parentConnectionId =
    (outOfBandRecord.getTag('parentConnectionId') as string | undefined) ?? options.connectionId

  const routing = await getMediationRouting(agentContext)

  const { connectionRecord: newConnection } = await outOfBandApi.acceptInvitation(options.outOfBandId, {
    label: options.label ?? '',
    routing,
    reuseConnection: true,
  })

  // Tag connection with its parent unless it is a connection to a public id
  // Invitations to public DIDs will always create standalone connections
  if (!tryParseDid(outOfBandRecord.outOfBandInvitation.id) && parentConnectionId && newConnection) {
    newConnection.setTag('parentConnectionId', parentConnectionId)
    await agentContext.dependencyManager
      .resolve(DidCommConnectionRepository)
      .update(agentContext, newConnection)
  }

  // Emit event: OOB Invitation accepted
  agentContext.dependencyManager.resolve(EventEmitter).emit<OutOfBandInvitationEvent>(agentContext, {
    type: OutOfBandInvitationEventTypes.OutOfBandInvitationEvent,
    payload: {
      action: 'Accepted',
      outOfBandRecord: outOfBandRecord.clone(),
      connection,
    },
  })

  return { connectionRecord: newConnection }
}

const getMediationRouting = async (agentContext: AgentContext) => {
  const routing = await agentContext.dependencyManager.resolve(DidCommRoutingService).getRouting(agentContext)
  const mediationRecipient = agentContext.dependencyManager.resolve(DidCommMediationRecipientApi)
  const didcommDocumentService = agentContext.dependencyManager.resolve(DidCommDocumentService)

  const mediatorConnection = await mediationRecipient.findDefaultMediatorConnection()
  const mediationRecord = await mediationRecipient.findDefaultMediator()
  if (!mediatorConnection || !mediatorConnection.invitationDid || !mediationRecord) {
    return
  }

  const services = await didcommDocumentService.resolveServicesFromDid(
    agentContext,
    mediatorConnection.invitationDid,
  )
  routing.endpoints = mediationRecord.endpoint
    ? [
        mediationRecord.endpoint,
        ...services.map(service => service.serviceEndpoint).filter(item => item !== mediationRecord.endpoint),
      ]
    : services.map(service => service.serviceEndpoint)

  return routing
}
