import {
  ConnectionProfileUpdatedEvent,
  ProfileEventTypes,
  DidCommUserProfileApi,
  UserProfileRequestedEvent,
} from '@2060.io/credo-ts-didcomm-user-profile'
import { AgentContext, EventEmitter } from '@credo-ts/core'
import {
  DidCommConnectionEventTypes,
  DidCommConnectionService,
  DidCommConnectionStateChangedEvent,
  DidCommDidExchangeRole,
  DidCommDidExchangeState,
  DidCommDiscoverFeaturesDisclosureReceivedEvent,
  DidCommDiscoverFeaturesEventTypes,
} from '@credo-ts/didcomm'

import { AgentActionType } from '../actions/AgentAction'
import {
  AcceptConnectionRequestParameters,
  AcceptConnectionResponseParameters,
  QueryServiceFeaturesParameters,
} from '../actions/types'
import { findOrCreateChatThread } from '../chat/services'

import { AgentActionQueueSingleton } from '@2060/services/AgentActionQueueSingleton'
import AgentSingleton from '@2060/services/AgentSingleton'
import RealmSingleton from '@2060/services/RealmSingleton'
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

  const disclosureListener = async (event: DidCommDiscoverFeaturesDisclosureReceivedEvent) => {
    const connection = event.payload.connection
    const connectionService = context.dependencyManager.resolve(DidCommConnectionService)
    const userProfileApi = context.dependencyManager.resolve(DidCommUserProfileApi)

    const features = event.payload.disclosures
    features.forEach(item => connection.metadata.add(`features-${item.type}`, { [item.id]: item.toJSON() }))

    await connectionService.update(context, connection)

    if (supportsUserProfile(connection)) {
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

  const profileRequestListener = async (event: UserProfileRequestedEvent) => {
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

  const profileUpdatedListener = async (event: ConnectionProfileUpdatedEvent) => {
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
    if (connectionRecord.state === DidExchangeState.Completed) {
      const parameters: QueryServiceFeaturesParameters = { connectionId: connectionRecord.id }
      agentActionQueueSingleton.addJob({
        type: AgentActionType.QueryServiceFeatures,
        parameters,
      })
      const isResponder = !connectionRecord.isRequester
      if (isResponder) {
        const realm = RealmSingleton.instance.getRealm()
        if (realm) findOrCreateChatThread(realm, connectionRecord)
      }
    }
  }

  eventEmitter.on(DidCommConnectionEventTypes.DidCommConnectionStateChanged, connectionListener)
  eventEmitter.on(DidCommDiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
  eventEmitter.on(ProfileEventTypes.UserProfileRequested, profileRequestListener)
  eventEmitter.on(ProfileEventTypes.ConnectionProfileUpdated, profileUpdatedListener)

  return () => {
    eventEmitter.off(DidCommConnectionEventTypes.DidCommConnectionStateChanged, connectionListener)
    eventEmitter.off(DidCommDiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
    eventEmitter.off(ProfileEventTypes.UserProfileRequested, profileRequestListener)
    eventEmitter.off(ProfileEventTypes.ConnectionProfileUpdated, profileUpdatedListener)
  }
}
