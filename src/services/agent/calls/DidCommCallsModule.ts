import type { DependencyManager, FeatureRegistry, Module } from '@credo-ts/core'

import { Protocol } from '@credo-ts/core'

import { DidCommCallsService } from './DidCommCallsService'
import { DidCommCallsApi } from './DidcommCallsApi'
import { CallAcceptHandler, CallEndHandler, CallOfferHandler, CallRejectHandler } from './handlers'
import { DidCommCallRole } from './models'

export class DidCommCallsModule implements Module {
  public readonly api = DidCommCallsApi

  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry): void {
    dependencyManager.registerContextScoped(DidCommCallsApi)

    dependencyManager.registerSingleton(DidCommCallsService)

    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/calls/1.0',
        roles: [
          DidCommCallRole.VideoCaller,
          DidCommCallRole.VideoCallee,
          DidCommCallRole.AudioCallee,
          DidCommCallRole.AudioCaller,
        ],
      }),
    )

    dependencyManager.registerMessageHandlers([
      new CallAcceptHandler(),
      new CallRejectHandler(),
      new CallOfferHandler(),
      new CallEndHandler(),
    ])
  }
}
