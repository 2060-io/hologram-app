import { AgentDependencies, DependencyManager, InitConfig } from '@credo-ts/core'
import { DidCommMediatorPickupStrategy } from '@credo-ts/didcomm'
import { DidCommVersion } from '@src/utils/developer'
import { getMobileAgentModules, MobileAgent } from './MobileAgent'
import { DidCommOutOfBandInvitationHandler } from './oob/OutOfBandInvitationHandler'
import { DidCommOutOfBandInvitationV2Handler } from './oob/OutOfBandInvitationV2Handler'

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
  dependencyManager?: DependencyManager
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
    dependencyManager
  )

  agent.didcomm.registerMessageHandlers([
    new DidCommOutOfBandInvitationHandler(),
    new DidCommOutOfBandInvitationV2Handler(),
  ])

  return agent
}
