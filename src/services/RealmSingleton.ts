import Realm from 'realm'

import { createAndStoreEncryptedKey, KeyChainService, retrieveEncryptedKey } from './keys'

import { log, logError } from '@2060/utils'
import { getRealmConfig } from '@2060/utils/realm'

export class RealmSingleton {
  private static instance: RealmSingleton | null = null
  private isOpen = false
  private realm: Realm | null = null

  static getInstance() {
    if (!RealmSingleton.instance) {
      RealmSingleton.instance = new RealmSingleton()
    }
    return RealmSingleton.instance
  }

  async openRealmIfIsClosed(realmConfig?: Realm.Configuration) {
    if (this.isOpen) return
    try {
      const key =
        (await retrieveEncryptedKey(KeyChainService.RealmMain)) ??
        (await createAndStoreEncryptedKey(KeyChainService.RealmMain))
      const config = realmConfig ?? getRealmConfig(key)
      const realm = await Realm.open(config)
      this.realm = realm
      this.isOpen = true
    } catch (error) {
      logError(`couldn't open realm: ${error}`)
    }
  }

  getRealm(): Realm | null {
    return this.realm
  }

  closeRealm() {
    log('Closing realm')
    this.realm?.close()
    this.realm = null
    this.isOpen = false
  }
}

export default RealmSingleton
