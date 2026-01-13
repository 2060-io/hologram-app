import { TypedArrayEncoder } from '@credo-ts/core'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  const realmInstance = useRef(RealmSingleton.instance)

  useEffect(() => {
    const openRealm = async () => {
      await realmInstance.current.openRealmIfIsClosed()
      const newRealm = realmInstance.current.getRealm()
      if (newRealm) setRealm(newRealm)
    }
    openRealm()
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
        await realmInstance.current.openRealmIfIsClosed(realmConfig)
        const newRealm = realmInstance.current.getRealm()
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
      realmInstance.current.closeRealm()
      setRealm(undefined)
    }
  }, [realm])

  return <LocalRealmContext value={{ realm, importAndOpenRealm, closeRealm }}>{children}</LocalRealmContext>
}
