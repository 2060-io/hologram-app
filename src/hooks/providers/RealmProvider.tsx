import { TypedArrayEncoder, utils } from '@credo-ts/core'
import React, { createContext, useCallback, useContext, useState } from 'react'
import Realm, { List } from 'realm'

import { getChatEntryTypeFromMimeType } from '../agent/chat/recordChangeHandlers/utils'

import {
  ChatEntry,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ChatThread,
  CacheRecord,
  isMediaType,
  MediaDownloadState,
  SystemMessageMetadata,
  UploadTask,
  VPResponsePresentedCredential,
} from '@2060/model'
import { InvitationState } from '@2060/model/InvitationState'
import { CredentialMainInfo } from '@2060/services/agent/display'
import { createAndStoreEncryptedKey, retrieveEncryptedKey, KeyChainService } from '@2060/services/keys'
import { logError } from '@2060/utils'
import { deleteFile, walletDirectoryPath } from '@2060/utils/RNFS'

export const CURRENT_REALM_SCHEMA_VERSION = 17

interface Props {
  children?: React.ReactNode
}

interface RealmState {
  realm?: Realm
}

interface RealmContextInterface extends RealmState {
  openRealm(): Promise<void>
  importAndOpenRealm: (backupFilePath: string, backupKeySeed: string) => Promise<void>
  closeRealm: (andDelete?: boolean) => void
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

  const onMigration = useCallback((oldRealm: Realm, newRealm: Realm) => {
    const oldThreads = oldRealm.objects<ChatThread>(ChatThread.name!)
    const newThreads = newRealm.objects<ChatThread>(ChatThread.name!)

    // loop through all objects and set the name property in the new schema
    for (let i = 0; i < oldThreads.length; i++) {
      if (oldRealm.schemaVersion < 3) {
        newThreads[i].archived = false
      }

      if (oldRealm.schemaVersion < 4) {
        newThreads[i].isService = false
        newThreads[i].parentId = undefined
      }

      if (oldRealm.schemaVersion < 5) {
        newThreads[i].subthreads = new List()
        oldThreads
          .filtered(`parentId == '${newThreads[i].id}'`)
          .forEach(item => newThreads[i].subthreads.push(item))
      }

      if (oldRealm.schemaVersion < 6) {
        const entries = oldRealm
          .objects<ChatEntry>('ChatEntryRealmObject')
          .filtered(`chatThreadId == '${newThreads[i].id}' SORT(createdAt DESC)`)
        newThreads[i].lastChatEntryState =
          entries[0].role === ChatEntryRole.Sender ? entries[0].state : undefined
      }
      if (oldRealm.schemaVersion < 7) {
        newThreads[i].active = true
      }
    }

    if (oldRealm.schemaVersion < 9) {
      const oldChatEntries = oldRealm.objects<ChatEntry>('ChatEntryRealmObject')
      for (let i = 0; i < oldChatEntries.length; i++) {
        newRealm.create<ChatEntry>('ChatEntry', {
          id: oldChatEntries[i].id,
          chatThreadId: oldChatEntries[i].chatThreadId,
          didcommThreadId: oldChatEntries[i].didcommThreadId,
          associatedMessageId: oldChatEntries[i].associatedMessageId,
          associatedRecordId: oldChatEntries[i].associatedRecordId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: (oldChatEntries[i] as any).elementType,
          role: oldChatEntries[i].role,
          state: oldChatEntries[i].state,
          metadata: oldChatEntries[i].metadata,
          createdAt: oldChatEntries[i].createdAt,
          unread: oldChatEntries[i].unread,
          relatedEntryProps: oldChatEntries[i].relatedEntryProps,
        })
      }
    }
    // Upgrade media type to the specific equivalent
    if (oldRealm.schemaVersion < 10) {
      const oldChatEntries = oldRealm.objects<ChatEntry>(
        oldRealm.schemaVersion >= 9 ? 'ChatEntry' : 'ChatEntryRealmObject',
      )
      const newChatEntries = newRealm.objects<ChatEntry>('ChatEntry')

      for (let i = 0; i < oldChatEntries.length; i++) {
        if ((oldChatEntries[i].type as string) === 'Media') {
          const mimeType = oldChatEntries[i].metadata?.mimeType as string
          if (!mimeType) continue
          const type = getChatEntryTypeFromMimeType(mimeType)
          if (!type) continue
          newChatEntries[i].type = type
        }
      }
    }

    // Upgrade connection invitation states
    if (oldRealm.schemaVersion < 11) {
      const oldChatEntries = oldRealm.objects<ChatEntry>(
        oldRealm.schemaVersion >= 9 ? 'ChatEntry' : 'ChatEntryRealmObject',
      )
      const newChatEntries = newRealm.objects<ChatEntry>('ChatEntry')

      for (let i = 0; i < oldChatEntries.length; i++) {
        if ((oldChatEntries[i].type as string) === ChatEntryType.Invitation) {
          const replied = oldChatEntries[i].metadata?.replied as boolean
          if (newChatEntries[i].metadata) {
            newChatEntries[i].metadata!.state = replied ? InvitationState.Accepted : InvitationState.Received
          }
        }
      }
    }

    if (oldRealm.schemaVersion < 14) {
      // Add initial security message chat entry to all entries
      for (const thread of oldThreads) {
        newRealm.create<ChatEntry>('ChatEntry', {
          id: utils.uuid(),
          chatThreadId: thread.id,
          didcommThreadId: '',
          associatedMessageId: '',
          associatedRecordId: '',
          type: ChatEntryType.System,
          role: ChatEntryRole.None,
          state: ChatEntryState.Viewed,
          metadata: { kind: 'security' } as SystemMessageMetadata,
          createdAt: thread.createdAt.getTime(),
          unread: false,
        })
      }
    }

    if (oldRealm.schemaVersion < 15) {
      const oldChatEntries = oldRealm.objects<ChatEntry>(
        oldRealm.schemaVersion >= 9 ? 'ChatEntry' : 'ChatEntryRealmObject',
      )
      const newChatEntries = newRealm.objects<ChatEntry>('ChatEntry')

      for (let i = 0; i < oldChatEntries.length; i++) {
        if (isMediaType(oldChatEntries[i].type)) {
          const localFilePath = newChatEntries[i]?.metadata?.localFilePath
          if (localFilePath) {
            const indexOfMedia = String(localFilePath).indexOf('media/')
            if (indexOfMedia >= 0) {
              const relativePath = String(localFilePath).substring(indexOfMedia)
              newChatEntries[i].metadata!.localFilePath = relativePath
            }
          }
          let localPreviewFilePath = newChatEntries[i]?.metadata?.localPreviewFilePath
          if (!localPreviewFilePath && oldChatEntries[i].type === ChatEntryType.Image) {
            localPreviewFilePath = localFilePath
          }
          if (localPreviewFilePath) {
            const indexOfMedia = String(localPreviewFilePath).indexOf('media/')
            if (indexOfMedia >= 0) {
              const relativePath = String(localPreviewFilePath).substring(indexOfMedia)
              newChatEntries[i].metadata!.localPreviewFilePath = relativePath
            }
          }
        }
      }
    }

    if (oldRealm.schemaVersion < 16) {
      const oldChatEntries = oldRealm.objects<ChatEntry>(
        oldRealm.schemaVersion >= 9 ? 'ChatEntry' : 'ChatEntryRealmObject',
      )
      const newChatEntries = newRealm.objects<ChatEntry>('ChatEntry')

      for (let i = 0; i < oldChatEntries.length; i++) {
        if (isMediaType(oldChatEntries[i].type)) {
          const localFilePath = newChatEntries[i]?.metadata?.localFilePath
          const mediaDownloadState = localFilePath ? MediaDownloadState.Done : MediaDownloadState.Pending
          newChatEntries[i].metadata!.mediaDownloadState = mediaDownloadState
        }
      }
    }
    if (oldRealm.schemaVersion < 17) {
      const oldChatEntries = oldRealm.objects<ChatEntry>(
        oldRealm.schemaVersion >= 9 ? 'ChatEntry' : 'ChatEntryRealmObject',
      )
      const newChatEntries = newRealm.objects<ChatEntry>('ChatEntry')
      for (let i = 0; i < oldChatEntries.length; i++) {
        if (oldChatEntries[i].type === ChatEntryType.VPResponse) {
          const presentedCredentialsString = newChatEntries[i]?.metadata?.presentedCredentials as string
          const presentedCredentials: CredentialMainInfo[] = presentedCredentialsString
            ? JSON.parse(presentedCredentialsString)
            : []
          if (presentedCredentials.length) {
            const newPresentedCredentialsStruct: VPResponsePresentedCredential[] = []
            for (const presentedCredential of presentedCredentials) {
              const newPresentedCredentialStruct: VPResponsePresentedCredential = {
                mainInfo: { ...presentedCredential },
              }
              newPresentedCredentialsStruct.push(newPresentedCredentialStruct)
            }
            newChatEntries[i].metadata!.presentedCredentials = JSON.stringify(newPresentedCredentialsStruct)
          }
        }
      }
    }
  }, [])

  const openRealm = useCallback(async () => {
    const key =
      (await retrieveEncryptedKey(KeyChainService.RealmMain)) ??
      (await createAndStoreEncryptedKey(KeyChainService.RealmMain))

    const realmConfig: Realm.Configuration = {
      encryptionKey: TypedArrayEncoder.fromHex(key),
      schema: [ChatEntry, ChatThread, UploadTask, CacheRecord],
      path: `${walletDirectoryPath}/main.realm`,
      schemaVersion: CURRENT_REALM_SCHEMA_VERSION,
      onMigration,
    }

    try {
      const newRealm = await Realm.open(realmConfig)
      setRealm(newRealm)
    } catch (error) {
      logError(`couldn't open realm: ${error}`)
      // TODO: Throw error
    }
  }, [realm])

  const importAndOpenRealm = useCallback(
    async (backupFilePath: string, backupKeyHex: string) => {
      const key = await createAndStoreEncryptedKey(KeyChainService.RealmMain)

      const realmConfig: Realm.Configuration = {
        encryptionKey: TypedArrayEncoder.fromHex(key),
        path: `${walletDirectoryPath}/main.realm`,
        schema: [ChatEntry, ChatThread, UploadTask, CacheRecord],
        schemaVersion: CURRENT_REALM_SCHEMA_VERSION,
        onMigration,
      }

      const backupRealm = await Realm.open({
        ...realmConfig,
        encryptionKey: TypedArrayEncoder.fromHex(backupKeyHex),
        path: backupFilePath,
      })
      backupRealm.writeCopyTo(realmConfig)
      backupRealm.close()
      try {
        const newRealm = await Realm.open(realmConfig)
        /**
        delete all UploadTask is done due to writeCopyTo or realm does not take into account
        schema parameter and it is including all objects in the backup
        */
        newRealm?.write(() => {
          const allUploadTaskObjects = newRealm.objects(UploadTask)
          newRealm.delete(allUploadTaskObjects)
        })
        if (setRealm) setRealm(newRealm)
      } catch (error) {
        logError('Error importing realm chats file', error)
      }
    },
    [realm],
  )

  const closeRealm = useCallback(
    (andDelete?: boolean) => {
      if (realm) {
        const path = realm.path
        realm.close()

        if (andDelete) {
          deleteFile(path)
        }
      }
      setRealm(undefined)
    },
    [realm],
  )

  return (
    <LocalRealmContext.Provider value={{ realm, openRealm, importAndOpenRealm, closeRealm }}>
      {children}
    </LocalRealmContext.Provider>
  )
}
