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

import { AgentActionOptions, AgentActionType } from '../actions/AgentAction'
import { AcceptConnectionRequestParameters } from '../actions/types'

import { supportsUserProfile } from '@2060/utils/connectionUtils'
import { language } from '@2060/utils/language'

export function manageAgentConnectionEvents(
  context: AgentContext,
  addAgentActionToQueue: (action: AgentActionOptions) => void,
) {
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
        await userProfileApi.sendUserProfile({
          connectionId: connection.id,
          sendBackYours: true,
          profileData: {
            ...(await userProfileApi.getUserProfileData()),
            preferredLanguage: language,
          },
        })
      }
    }
  }

  const profileRequestListener = async (event: UserProfileRequestedEvent) => {
    const userProfileApi = context.dependencyManager.resolve(UserProfileApi)
    await userProfileApi.sendUserProfile({
      connectionId: event.payload.connection.id,
      sendBackYours: false,
      threadId: event.payload.threadId,
      profileData: {
        ...(await userProfileApi.getUserProfileData()),
        preferredLanguage: language,
      },
    })
  }

  const profileUpdatedListener = async (event: ConnectionProfileUpdatedEvent) => {
    const userProfileApi = context.dependencyManager.resolve(UserProfileApi)
    if (event.payload.sendBackYoursRequested) {
      await userProfileApi.sendUserProfile({
        connectionId: event.payload.connection.id,
        sendBackYours: false,
        threadId: event.payload.threadId,
        profileData: {
          ...(await userProfileApi.getUserProfileData()),
          preferredLanguage: language,
        },
      })
    }
  }

  // Track connections and proof exchanges to update connection metadata accordingly
  const connectionListener = async (event: ConnectionStateChangedEvent) => {
    const { connectionRecord } = event.payload
    if (connectionRecord.state === DidExchangeState.RequestReceived) {
      const parameters: AcceptConnectionRequestParameters = { connectionId: connectionRecord.id }
      addAgentActionToQueue({
        type: AgentActionType.AcceptConnectionRequest,
        parameters,
      })
    } else if (
      connectionRecord.state === DidExchangeState.ResponseReceived &&
      !connectionRecord.autoAcceptConnection
    ) {
      addAgentActionToQueue({
        type: AgentActionType.AcceptConnectionResponse,
        parameters: {
          connectionId: connectionRecord.id,
        },
      })
    }
    if (connectionRecord.isReady) {
      addAgentActionToQueue({
        type: AgentActionType.QueryServiceFeatures,
        parameters: {
          connectionId: connectionRecord.id,
        },
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
