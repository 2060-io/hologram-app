import {
  DidCommConnectionProfileUpdatedEvent,
  DidCommProfileEventTypes,
  DidCommUserProfileApi,
  DidCommUserProfileRequestedEvent,
} from '@2060.io/credo-ts-didcomm-user-profile'
import { AgentContext, EventEmitter } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  DidCommConnectionRecord,
  DidCommConnectionService,
  DidCommConnectionStateChangedEvent,
  DidCommDidExchangeRole,
  DidCommDidExchangeState,
  DidCommDiscoverFeaturesDisclosureReceivedEvent,
  DidCommDiscoverFeaturesEventTypes,
  DidCommTrustPingEventTypes,
  DidCommTrustPingReceivedEvent,
  TrustPingResponseReceivedEvent,
} from '@credo-ts/didcomm'
import { AgentActionQueueSingleton } from '@src/services/AgentActionQueueSingleton'
import AgentSingleton from '@src/services/AgentSingleton'
import RealmSingleton from '@src/services/RealmSingleton'
import { isMediatorConnection, isService, supportsUserProfile } from '@src/utils/connectionUtils'
import { language } from '@src/utils/language'
import { log } from '@src/utils/log'
import { AgentActionType } from '../actions/AgentAction'
import {
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  QueryServiceFeaturesParameters,
  SendTrustPingParameters,
} from '../actions/types'
import { findOrCreateChatThread } from '../chat/services'

export function subscribeToAgentConnectionEvents(context: AgentContext) {
  const mobileAgentInstance = AgentSingleton.instance
  if (mobileAgentInstance.getIsAppSubscribedToConnectionEvents()) {
    log('From main flow App is already subscribed to agent connection events')
    return
  }
  mobileAgentInstance.setIsAppSubscribedToConnectionEvents(true)
  const agentActionQueueSingleton = AgentActionQueueSingleton.instance
  const eventEmitter = context.dependencyManager.resolve(EventEmitter)

  const disclosureListener = async (event: DidCommDiscoverFeaturesDisclosureReceivedEvent) => {
    const connection = event.payload.connection
    const connectionService = context.dependencyManager.resolve(DidCommConnectionService)
    const userProfileApi = context.dependencyManager.resolve(DidCommUserProfileApi)

    const features = event.payload.disclosures
    features.forEach((item) => connection.metadata.add(`features-${item.type}`, { [item.id]: item.toJSON() }))

    await connectionService.update(context, connection)

    // A service gets its data from Verifiable Trust resolution. Hologram sends its profile to a
    // service only when the service requests it. In DIDComm v2 both sides have the Responder role,
    // so the role alone does not identify a peer that scanned our invitation.
    if (supportsUserProfile(connection) && !isService(connection)) {
      if (connection.role === DidCommDidExchangeRole.Responder) {
        agentActionQueueSingleton.addJob({
          type: AgentActionType.SendUserProfile,
          parameters: {
            connectionId: connection.id,
            sendBackYours: true,
            profileData: {
              ...(await userProfileApi.getUserProfileData()),
              preferredLanguage: language,
            },
          },
        })
      }
    }
  }

  const profileRequestListener = async (event: DidCommUserProfileRequestedEvent) => {
    const userProfileApi = context.dependencyManager.resolve(DidCommUserProfileApi)
    agentActionQueueSingleton.addJob({
      type: AgentActionType.SendUserProfile,
      parameters: {
        connectionId: event.payload.connection.id,
        sendBackYours: false,
        threadId: event.payload.threadId,
        profileData: {
          ...(await userProfileApi.getUserProfileData()),
          preferredLanguage: language,
        },
      },
    })
  }

  const profileUpdatedListener = async (event: DidCommConnectionProfileUpdatedEvent) => {
    const userProfileApi = context.dependencyManager.resolve(DidCommUserProfileApi)
    if (event.payload.sendBackYoursRequested) {
      agentActionQueueSingleton.addJob({
        type: AgentActionType.SendUserProfile,
        parameters: {
          connectionId: event.payload.connection.id,
          sendBackYours: false,
          threadId: event.payload.threadId,
          profileData: {
            ...(await userProfileApi.getUserProfileData()),
            preferredLanguage: language,
          },
        },
      })
    }
  }

  const queriedConnectionIds = new Set<string>()
  const queryServiceFeatures = (connectionRecord: DidCommConnectionRecord) => {
    if (queriedConnectionIds.has(connectionRecord.id)) return
    queriedConnectionIds.add(connectionRecord.id)
    const parameters: QueryServiceFeaturesParameters = { connectionId: connectionRecord.id }
    agentActionQueueSingleton.addJob({
      type: AgentActionType.QueryServiceFeatures,
      parameters,
    })
  }

  // A v2 connection queries the features once the peer has answered or sent a trust ping
  const trustPingListener = async (event: DidCommTrustPingReceivedEvent | TrustPingResponseReceivedEvent) => {
    const { connectionRecord } = event.payload
    if (connectionRecord.didcommVersion !== 'v2' || isMediatorConnection(connectionRecord)) return
    queryServiceFeatures(connectionRecord)
  }

  // Track connections and proof exchanges to update connection metadata accordingly
  const connectionListener = async (event: DidCommConnectionStateChangedEvent) => {
    const { connectionRecord } = event.payload
    if (connectionRecord.state === DidCommDidExchangeState.RequestReceived) {
      const parameters: AcceptConnectionRequestParameters = { connectionId: connectionRecord.id }
      agentActionQueueSingleton.addJob({
        type: AgentActionType.AcceptConnectionRequest,
        parameters,
      })
    } else if (
      connectionRecord.state === DidCommDidExchangeState.ResponseReceived &&
      !connectionRecord.autoAcceptConnection
    ) {
      const parameters: AcceptConnectionResponseParameters = { connectionId: connectionRecord.id }
      agentActionQueueSingleton.addJob({
        type: AgentActionType.AcceptConnectionResponse,
        parameters,
      })
    }
    if (connectionRecord.state === DidCommDidExchangeState.Completed) {
      // The mediator is not a chat peer. In DIDComm v2 the connection is completed before the
      // mediation grant adds the Mediator connection type, so the alias identifies it here.
      if (isMediatorConnection(connectionRecord)) return

      if (connectionRecord.didcommVersion === 'v2') {
        // A v2 connection has no handshake: the peer creates its record on our first message.
        // Two first messages in flight make the peer create two connections, so the trust ping
        // goes alone and the features query waits for the ping exchange (trustPingListener).
        const parameters: SendTrustPingParameters = { connectionId: connectionRecord.id }
        agentActionQueueSingleton.addJob({
          type: AgentActionType.SendTrustPing,
          parameters,
        })
      } else {
        queryServiceFeatures(connectionRecord)
      }
      const isResponder = !connectionRecord.isRequester
      if (isResponder) {
        const realm = RealmSingleton.instance.getRealm()
        if (realm) findOrCreateChatThread(realm, connectionRecord)
      }
    }
  }

  eventEmitter.on(DidCommConnectionEventTypes.DidCommConnectionStateChanged, connectionListener)
  eventEmitter.on(DidCommDiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
  eventEmitter.on(DidCommProfileEventTypes.UserProfileRequested, profileRequestListener)
  eventEmitter.on(DidCommProfileEventTypes.ConnectionProfileUpdated, profileUpdatedListener)
  eventEmitter.on(DidCommTrustPingEventTypes.DidCommTrustPingReceivedEvent, trustPingListener)
  eventEmitter.on(DidCommTrustPingEventTypes.DidCommTrustPingResponseReceivedEvent, trustPingListener)

  return () => {
    eventEmitter.off(DidCommTrustPingEventTypes.DidCommTrustPingReceivedEvent, trustPingListener)
    eventEmitter.off(DidCommTrustPingEventTypes.DidCommTrustPingResponseReceivedEvent, trustPingListener)
    eventEmitter.off(DidCommConnectionEventTypes.DidCommConnectionStateChanged, connectionListener)
    eventEmitter.off(DidCommDiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
    eventEmitter.off(DidCommProfileEventTypes.UserProfileRequested, profileRequestListener)
    eventEmitter.off(DidCommProfileEventTypes.ConnectionProfileUpdated, profileUpdatedListener)
  }
}
