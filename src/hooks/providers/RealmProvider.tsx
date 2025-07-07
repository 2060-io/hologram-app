import { TypedArrayEncoder } from '@credo-ts/core'
import React, { createContext, useCallback, useContext, useState } from 'react'
import Realm from 'realm'

import { UploadTask } from '@2060/model'
import RealmSingleton from '@2060/services/RealmSingleton'
import { createAndStoreEncryptedKey, KeyChainService } from '@2060/services/keys'
import { logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'
import { getRealmConfig } from '@2060/utils/realm'

interface Props {
  children?: React.ReactNode
}

interface RealmState {
  realm?: Realm
}

interface RealmContextInterface extends RealmState {
  openRealm(): Promise<void>
  importAndOpenRealm: (realmFilePath: string, backupKeySeed: string) => Promise<void>
  closeRealm: () => void
}

const LocalRealmContext = createContext<RealmContextInterface | undefined>(undefined)

export const useLocalRealm = () => {
  const realmContext = useContext(LocalRealmContext)
  if (!realmContext) {
    throw new Error('useLocalrealm must be used within a RealmContextProvider')
  }

  return realmContext
}

export const RealmProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [realm, setRealm] = useState<Realm | undefined>()

  const openRealm = useCallback(async () => {
    const realmInstance = RealmSingleton.getInstance()
    await realmInstance.openRealm()
    const newRealm = realmInstance.getRealm()
    if (newRealm) setRealm(newRealm)
  }, [])

  const importAndOpenRealm = useCallback(
    async (realmFilePath: string, backupKeyHex: string) => {
      const key = await createAndStoreEncryptedKey(KeyChainService.RealmMain)
      const realmConfig = getRealmConfig(key)
      const backupRealm = await Realm.open({
        ...realmConfig,
        encryptionKey: TypedArrayEncoder.fromHex(backupKeyHex),
        path: realmFilePath,
      })
      backupRealm.writeCopyTo(realmConfig)
      backupRealm.close()
      try {
        const realmInstance = RealmSingleton.getInstance()
        await realmInstance.openRealm(realmConfig)
        const newRealm = realmInstance.getRealm()
        if (!newRealm) return
        /**
        delete all UploadTask is done due to writeCopyTo or realm does not take into account
        schema parameter and it is including all objects in the backup
        */
        newRealm?.write(() => {
          const allUploadTaskObjects = newRealm.objects(UploadTask)
          newRealm.delete(allUploadTaskObjects)
        })
        setRealm(newRealm)
      } catch (error) {
        logError('Error importing realm chats file', error)
      }
    },
    [realm],
  )

  const closeRealm = useCallback(async () => {
    if (realm) {
      const { path } = realm
      await deleteFile(path)
      const realmInstance = RealmSingleton.getInstance()
      realmInstance.closeRealm()
      setRealm(undefined)
    }
  }, [realm])

  return (
    <LocalRealmContext.Provider value={{ realm, openRealm, importAndOpenRealm, closeRealm }}>
      {children}
    </LocalRealmContext.Provider>
  )
}
