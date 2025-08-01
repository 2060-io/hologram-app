import { MobileAgent } from './agent/MobileAgent'
import { KeyChainService, retrieveEncryptedKey } from './keys'
import { baseAgentConfig, setupMobileAgent } from './setupMobileAgent'

import { logError, logWarn } from '@2060/utils'
import { walletDirectoryPath } from '@2060/utils/RNFS'

export class AgentSingleton {
  private static agentInstance: AgentSingleton
  private isSetup = false
  private isInitialized = false
  private mobileAgent: MobileAgent | null = null
  private isAppSubscribedToEvents = false

  static get instance() {
    if (!this.agentInstance) {
      this.agentInstance = new AgentSingleton()
    }
    return this.agentInstance
  }

  async setupMobileAgent() {
    if (this.isSetup) return
    const agent = await setupMobileAgent(baseAgentConfig)
    this.mobileAgent = agent
    this.isSetup = true
  }

  async openAndInitMobileAgent() {
    if (this.isInitialized) return
    try {
      this.isInitialized = true
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
      this.isInitialized = false
      logError(`error initializing singleton agent: ${error}`)
    }
  }

  getMobileAgent() {
    return this.mobileAgent
  }

  setAppIsSubscribedToEvents() {
    this.isAppSubscribedToEvents = true
  }

  getIsAppSubscribedToEvents() {
    return this.isAppSubscribedToEvents
  }

  getIsInitialized() {
    return this.isInitialized
  }
}

export default AgentSingleton
