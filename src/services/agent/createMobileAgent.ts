import { InitConfig, AgentDependencies, DependencyManager } from '@credo-ts/core'
import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'

import { MobileAgent, getMobileAgentModules } from './MobileAgent'
import { DidCommOutOfBandInvitationHandler } from './oob/OutOfBandInvitationHandler'

export const createMobileAgent = (
  options: {
    config: InitConfig
    indyVDRProxyBaseUrl: string
    modulesConfig: {
      mediatorPickupStrategy?: DidCommMediatorPickupStrategy
    }
    dependencies: AgentDependencies
  },
  dependencyManager?: DependencyManager,
) => {
    console.log('creando mobile agent)')
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

  console.log('creado')

  agent.didcomm.registerMessageHandlers([new DidCommOutOfBandInvitationHandler()])

  return agent
}
