import { MobileAgent } from './agent/MobileAgent'
import { KeyChainService, retrieveEncryptedKey } from './keys'
import { setupMobileAgent } from './setupMobileAgent'

import { logError, log } from '@src/utils'

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

        log('initializing agent...')
        await this.mobileAgent.initialize()
        log('agent initialized!')
      } else {
        log('Agent is being opened, so skipping opening again to avoid error')
      }
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

  reset() {
    this.isSetup = false
    this.isOpening = false
    this.mobileAgent = null
    this.isAppSubscribedToChatEvents = false
    this.isAppSubscribedToConnectionEvents = false
  }
}

export default AgentSingleton
