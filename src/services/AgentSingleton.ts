import Config from 'react-native-config'

import { MobileAgent } from './agent/MobileAgent'
import { KeyChainService, retrieveEncryptedKey } from './keys'
import { DEV_ENVS_PERSIST_KEY, getStorageData } from './localStorage'
import { baseAgentConfig, setupMobileAgent } from './setupMobileAgent'

import { logError, logWarn } from '@2060/utils'
import { walletDirectoryPath } from '@2060/utils/RNFS'
import { DevEnvsObject } from '@2060/utils/developer'

const getIndyVDRProxyBaseUrl = async () => {
  const persistedDevEnvs = await getStorageData(DEV_ENVS_PERSIST_KEY)
  if (persistedDevEnvs) {
    return (persistedDevEnvs as DevEnvsObject).INDY_VDR_PROXY_BASE_URL
  }
  return Config.INDY_VDR_PROXY_BASE_URL
}

export class AgentSingleton {
  private static instance: AgentSingleton | null = null
  private isInitialized = false
  private mobileAgent: MobileAgent | null = null
  private isAppSubscribedToEvents = false

  static getInstance() {
    if (!AgentSingleton.instance) {
      AgentSingleton.instance = new AgentSingleton()
    }
    return AgentSingleton.instance
  }

  async initialize() {
    if (this.isInitialized) return
    const indyVDRProxyBaseUrl = await getIndyVDRProxyBaseUrl()
    const agent = setupMobileAgent(baseAgentConfig, indyVDRProxyBaseUrl)
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
    } catch (error) {
      logError(`error initializing agent: ${error}`)
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
