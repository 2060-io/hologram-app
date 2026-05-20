import { log, logError } from '@src/utils'
import { getRealmConfig } from '@src/utils/realm'
import Realm from 'realm'
import { createAndStoreEncryptedKey, KeyChainService, retrieveEncryptedKey } from './keys'

export class RealmSingleton {
  private static realmInstance: RealmSingleton
  private isOpen = false
  private realm: Realm | null = null

  static get instance() {
    if (!RealmSingleton.realmInstance) {
      RealmSingleton.realmInstance = new RealmSingleton()
    }
    return RealmSingleton.realmInstance
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
