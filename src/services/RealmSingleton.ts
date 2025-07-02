import Realm from 'realm'

import { createAndStoreEncryptedKey, KeyChainService, retrieveEncryptedKey } from './keys'

import { getRealmConfig } from '@2060/hooks/providers/RealmProvider'
import { logError } from '@2060/utils'

export class RealmSingleton {
  private static instance: RealmSingleton | null = null
  private isInitialized = false
  private realm: Realm | null = null

  static getInstance() {
    if (!RealmSingleton.instance) {
      RealmSingleton.instance = new RealmSingleton()
    }
    return RealmSingleton.instance
  }

  async initialize() {
    if (this.isInitialized) return
    try {
      const key =
        (await retrieveEncryptedKey(KeyChainService.RealmMain)) ??
        (await createAndStoreEncryptedKey(KeyChainService.RealmMain))
      const realmConfig = getRealmConfig(key)
      const realm = await Realm.open(realmConfig)
      this.realm = realm
      this.isInitialized = true
    } catch (error) {
      logError(`couldn't open realm: ${error}`)
    }
  }

  getRealm(): Realm | null {
    return this.realm
  }
}

export default RealmSingleton
