import type { DependencyManager, FeatureRegistry, Module } from '@credo-ts/core'

import { Protocol } from '@credo-ts/core'

import { DidCommReactionsService } from './DidCommReactionsService'
import { DidCommReactionsApi } from './DidcommReactionsApi'
import { DidCommReactionRole } from './models'

export class DidCommReactionsModule implements Module {
  public readonly api = DidCommReactionsApi

  public register(dependencyManager: DependencyManager, featureRegistry: FeatureRegistry): void {
    dependencyManager.registerContextScoped(DidCommReactionsApi)

    dependencyManager.registerSingleton(DidCommReactionsService)

    featureRegistry.register(
      new Protocol({
        id: 'https://didcomm.org/reactions/1.0',
        roles: [DidCommReactionRole.Receiver, DidCommReactionRole.Sender],
      }),
    )
  }
}
