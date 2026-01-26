import {
  ConnectionProfileUpdatedEvent,
  ProfileEventTypes,
  UserProfileApi,
  UserProfileRequestedEvent,
} from '@2060.io/credo-ts-didcomm-user-profile'
import {
  DiscoverFeaturesDisclosureReceivedEvent,
  DidExchangeRole,
  ConnectionStateChangedEvent,
  ConnectionEventTypes,
  DiscoverFeaturesEventTypes,
  AgentContext,
  ConnectionService,
  EventEmitter,
  DidExchangeState,
} from '@credo-ts/core'

import { AgentActionType } from '../actions/AgentAction'
import {
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  QueryServiceFeaturesParameters,
} from '../actions/types'

import { AgentActionQueueSingleton } from '@2060/services/AgentActionQueueSingleton'
import AgentSingleton from '@2060/services/AgentSingleton'
import { supportsUserProfile } from '@2060/utils/connectionUtils'
import { language } from '@2060/utils/language'
import { log } from '@2060/utils/log'

export function subscribeToAgentConnectionEvents(context: AgentContext) {
  const mobileAgentInstance = AgentSingleton.instance
  if (mobileAgentInstance.getIsAppSubscribedToConnectionEvents()) {
    log('From main flow App is already subscribed to agent connection events')
    return
  }
  mobileAgentInstance.setIsAppSubscribedToConnectionEvents(true)
  const agentActionQueueSingleton = AgentActionQueueSingleton.instance
  const eventEmitter = context.dependencyManager.resolve(EventEmitter)

  const disclosureListener = async (event: DiscoverFeaturesDisclosureReceivedEvent) => {
    const connection = event.payload.connection
    const connectionService = context.dependencyManager.resolve(ConnectionService)
    const userProfileApi = context.dependencyManager.resolve(UserProfileApi)

    const features = event.payload.disclosures
    features.forEach(item => connection.metadata.add(`features-${item.type}`, { [item.id]: item.toJSON() }))

    await connectionService.update(context, connection)

    if (supportsUserProfile(connection)) {
      if (connection.role === DidExchangeRole.Responder) {
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

  const profileRequestListener = async (event: UserProfileRequestedEvent) => {
    const userProfileApi = context.dependencyManager.resolve(UserProfileApi)
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

  const profileUpdatedListener = async (event: ConnectionProfileUpdatedEvent) => {
    const userProfileApi = context.dependencyManager.resolve(UserProfileApi)
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

  // Track connections and proof exchanges to update connection metadata accordingly
  const connectionListener = async (event: ConnectionStateChangedEvent) => {
    const { connectionRecord } = event.payload
    if (connectionRecord.state === DidExchangeState.RequestReceived) {
      const parameters: AcceptConnectionRequestParameters = { connectionId: connectionRecord.id }
      agentActionQueueSingleton.addJob({
        type: AgentActionType.AcceptConnectionRequest,
        parameters,
      })
    } else if (
      connectionRecord.state === DidExchangeState.ResponseReceived &&
      !connectionRecord.autoAcceptConnection
    ) {
      const parameters: AcceptConnectionResponseParameters = { connectionId: connectionRecord.id }
      agentActionQueueSingleton.addJob({
        type: AgentActionType.AcceptConnectionResponse,
        parameters,
      })
    }
    if (connectionRecord.isReady) {
      const parameters: QueryServiceFeaturesParameters = { connectionId: connectionRecord.id }
      agentActionQueueSingleton.addJob({
        type: AgentActionType.QueryServiceFeatures,
        parameters,
      })
    }
  }

  eventEmitter.on(ConnectionEventTypes.ConnectionStateChanged, connectionListener)
  eventEmitter.on(DiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
  eventEmitter.on(ProfileEventTypes.UserProfileRequested, profileRequestListener)
  eventEmitter.on(ProfileEventTypes.ConnectionProfileUpdated, profileUpdatedListener)

  return () => {
    eventEmitter.off(ConnectionEventTypes.ConnectionStateChanged, connectionListener)
    eventEmitter.off(DiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
    eventEmitter.off(ProfileEventTypes.UserProfileRequested, profileRequestListener)
    eventEmitter.off(ProfileEventTypes.ConnectionProfileUpdated, profileUpdatedListener)
  }
}
