import {
  DiscoverFeaturesDisclosureReceivedEvent,
  DidExchangeRole,
  ConnectionStateChangedEvent,
  ConnectionEventTypes,
  DiscoverFeaturesEventTypes,
  AgentContext,
  ConnectionService,
  DiscoverFeaturesApi,
  EventEmitter,
} from '@credo-ts/core'
import { UserProfileApi } from 'credo-ts-user-profile'

import { supportsUserProfile } from '@2060/utils/connectionUtils'

export function manageAgentConnectionEvents(context: AgentContext) {
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
        await userProfileApi.sendUserProfile({ connectionId: connection.id, sendBackYours: true })
      }
    }
  }

  // Track connections and proof exchanges to update connection metadata accordingly
  const connectionListener = async (event: ConnectionStateChangedEvent) => {
    const connectionRecord = event.payload.connectionRecord
    const discoverFeaturesApi = context.dependencyManager.resolve(DiscoverFeaturesApi)

    if (connectionRecord.isReady) {
      await discoverFeaturesApi.queryFeatures({
        protocolVersion: 'v2',
        queries: [
          { featureType: 'protocol', match: 'https://didcomm.org/media-sharing/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/reactions/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/receipts/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/user-profile/1.0' },
          { featureType: 'protocol', match: 'https://didcomm.org/calls/1.0' },
        ],
        connectionId: connectionRecord.id,
      })
    }
  }

  eventEmitter.on(ConnectionEventTypes.ConnectionStateChanged, connectionListener)
  eventEmitter.on(DiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)

  return () => {
    eventEmitter.off(ConnectionEventTypes.ConnectionStateChanged, connectionListener)
    eventEmitter.off(DiscoverFeaturesEventTypes.DisclosureReceived, disclosureListener)
  }
}
