import { InitConfig, MediatorPickupStrategy, AgentDependencies, DependencyManager } from '@credo-ts/core'

import { MobileAgent, getMobileAgentModules } from './MobileAgent'
import { OutOfBandInvitationHandler } from './oob/OutOfBandInvitationHandler'

export const createMobileAgent = (
  options: {
    config: InitConfig
    indyVDRProxyBaseUrl: string
    modulesConfig: {
      mediatorPickupStrategy?: MediatorPickupStrategy
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
        mediatorPickupStrategy: options.modulesConfig.mediatorPickupStrategy,
        indyVDRProxyBaseUrl: options.indyVDRProxyBaseUrl,
      }),
    },
    dependencyManager,
  )

  agent.dependencyManager.registerMessageHandlers([new OutOfBandInvitationHandler()])

  return agent
}
