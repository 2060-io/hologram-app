import { InitConfig, AgentDependencies, DependencyManager } from '@credo-ts/core'
import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'

import { MobileAgent, getMobileAgentModules } from './MobileAgent'
import { DidCommOutOfBandInvitationHandler } from './oob/OutOfBandInvitationHandler'

export const createMobileAgent = (
  options: {
    storeId: string
    storeKey: string
    config: InitConfig
    indyVDRProxyBaseUrl: string
    modulesConfig: {
      mediatorPickupStrategy?: DidCommMediatorPickupStrategy
    }
    dependencies: AgentDependencies
  },
  dependencyManager?: DependencyManager,
) => {
  const agent = new MobileAgent(
    {
      config: options.config,
      dependencies: options.dependencies,
      modules: getMobileAgentModules({
        storeId: options.storeId,
        storeKey: options.storeKey,
        mediatorPickupStrategy: options.modulesConfig.mediatorPickupStrategy,
        indyVDRProxyBaseUrl: options.indyVDRProxyBaseUrl,
      }),
    },
    dependencyManager,
  )

  agent.didcomm.registerMessageHandlers([new DidCommOutOfBandInvitationHandler()])

  return agent
}
