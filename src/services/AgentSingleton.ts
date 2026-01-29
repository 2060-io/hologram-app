import { MobileAgent } from './agent/MobileAgent'
import { KeyChainService, retrieveEncryptedKey } from './keys'
import { setupMobileAgent } from './setupMobileAgent'

import { logError, log } from '@2060/utils'

export class AgentSingleton {
  private static agentInstance: AgentSingleton
  private isSetup = false
  private isOpening = false
  private mobileAgent: MobileAgent | null = null
  private isAppSubscribedToChatEvents = false
  private isAppSubscribedToConnectionEvents = false

  static get instance() {
    if (!this.agentInstance) {
      this.agentInstance = new AgentSingleton()
    }
    return this.agentInstance
  }

  async setupMobileAgent() {
    if (this.isSetup) return
    const agent = await setupMobileAgent()
    this.mobileAgent = agent
    this.isSetup = true
  }

  async openAndInitMobileAgent() {
    try {
      const key = await retrieveEncryptedKey(KeyChainService.AfjWallet)
      if (!this.mobileAgent) return
      if (!key) throw new Error('No wallet key stored')
      if (!this.isOpening) {
        this.isOpening = true
        log('opening agent...')
        // Reconfigure askar store config with retrieved key
        this.mobileAgent.modules.askar.config.store.key = key
        await this.mobileAgent.modules.askar.openStore()
      } else {
        log('Agent is being opened, so skipping opening again to avoid error')
      }
      log('initializing agent...')
      await this.mobileAgent?.initialize()
      log('¡agent initialized!')
    } catch (error) {
      logError(`error initializing singleton agent: ${error}`)
    } finally {
      this.isOpening = false
    }
  }

  getMobileAgent() {
    return this.mobileAgent
  }

  setAppIsSubscribedChatToEvents(isAppSubscribedToChatEvents: boolean) {
    this.isAppSubscribedToChatEvents = isAppSubscribedToChatEvents
  }

  getIsAppSubscribedToChatEvents() {
    return this.isAppSubscribedToChatEvents
  }

  setIsAppSubscribedToConnectionEvents(isAppSubscribedToConnectionEvents: boolean) {
    this.isAppSubscribedToConnectionEvents = isAppSubscribedToConnectionEvents
  }

  getIsAppSubscribedToConnectionEvents() {
    return this.isAppSubscribedToConnectionEvents
  }
}

export default AgentSingleton
