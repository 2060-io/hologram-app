import { MobileAgent } from './agent/MobileAgent'
import { KeyChainService, retrieveEncryptedKey } from './keys'
import { baseAgentConfig, setupMobileAgent } from './setupMobileAgent'

import { logError, logWarn } from '@2060/utils'
import { walletDirectoryPath } from '@2060/utils/RNFS'

export class AgentSingleton {
  private static agentInstance: AgentSingleton
  private isInitialized = false
  private mobileAgent: MobileAgent | null = null
  private isAppSubscribedToEvents = false

  static get instance() {
    if (!this.agentInstance) {
      this.agentInstance = new AgentSingleton()
    }
    return this.agentInstance
  }

  async initializeMobileAgent() {
    if (this.isInitialized) return
    const agent = await setupMobileAgent(baseAgentConfig)
    this.mobileAgent = agent
    this.isInitialized = true
  }

  async openAndInitMobileAgent() {
    try {
      const storage = { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } }
      const getWalletConfig = (storeKey: string) => ({ id: 'afj', key: storeKey, storage })
      const key = await retrieveEncryptedKey(KeyChainService.AfjWallet)
      if (!key) throw new Error('No wallet key stored')
      logWarn('opening agent...')
      await this.mobileAgent?.wallet.open(getWalletConfig(key))
      logWarn('initializing agent...')
      await this.mobileAgent?.initialize()
      logWarn('¡agent initialized!')
    } catch (error) {
      logError(`error initializing singleton agent: ${error}`)
    }
  }

  getMobileAgent(): MobileAgent | null {
    return this.mobileAgent
  }

  setAppIsSubscribedToEvents() {
    this.isAppSubscribedToEvents = true
  }

  getIsAppSubscribedToEvents(): boolean {
    return this.isAppSubscribedToEvents
  }
}

export default AgentSingleton
