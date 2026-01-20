import { MobileAgent } from './agent/MobileAgent'
import { KeyChainService, retrieveEncryptedKey } from './keys'
import { setupMobileAgent } from './setupMobileAgent'

import { logError, log } from '@2060/utils'
import { walletDirectoryPath } from '@2060/utils/RNFS'

export class AgentSingleton {
  private static agentInstance: AgentSingleton
  private isSetup = false
  private isOpening = false
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
    const agent = await setupMobileAgent()
    this.mobileAgent = agent
    this.isSetup = true
  }

  async openAndInitMobileAgent() {
    try {
      const storage = { type: 'sqlite', config: { path: `${walletDirectoryPath}/afj.sqlite` } }
      const getWalletConfig = (storeKey: string) => ({ id: 'afj', key: storeKey, storage })
      const key = await retrieveEncryptedKey(KeyChainService.AfjWallet)
      if (!key) throw new Error('No wallet key stored')
      if (!this.isOpening) {
        this.isOpening = true
        log('opening agent...')
        await this.mobileAgent?.wallet.open(getWalletConfig(key))
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

  setAppIsSubscribedToEvents(isAppSubscribedToEvents: boolean) {
    this.isAppSubscribedToEvents = isAppSubscribedToEvents
  }

  getIsAppSubscribedToEvents() {
    return this.isAppSubscribedToEvents
  }
}

export default AgentSingleton
