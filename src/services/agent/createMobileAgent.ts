import { InitConfig, AgentDependencies, DependencyManager } from '@credo-ts/core'
import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'

import { MobileAgent, getMobileAgentModules } from './MobileAgent'
import { DidCommOutOfBandInvitationHandler } from './oob/OutOfBandInvitationHandler'

import { DidCommVersion } from '@src/utils/developer'

export const createMobileAgent = (
  options: {
    config: InitConfig
    indyVDRProxyBaseUrl: string
    modulesConfig: {
      mediatorPickupStrategy?: DidCommMediatorPickupStrategy
      didcommVersions: DidCommVersion[]
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
        didcommVersions: options.modulesConfig.didcommVersions,
        indyVDRProxyBaseUrl: options.indyVDRProxyBaseUrl,
      }),
    },
    dependencyManager,
  )

  agent.didcomm.registerMessageHandlers([new DidCommOutOfBandInvitationHandler()])

  return agent
}
