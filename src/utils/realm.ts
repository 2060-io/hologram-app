import { TypedArrayEncoder, utils } from '@credo-ts/core'
import Realm, { List } from 'realm'

import { walletDirectoryPath } from './RNFS'

import { getChatEntryTypeFromMimeType } from '@src/hooks/agent/chat/recordChangeHandlers/utils'
import {
  CacheRecord,
  ChatEntry,
  ChatEntryRole,
  ChatEntryState,
  ChatEntryType,
  ChatThread,
  isMediaType,
  MediaDownloadState,
  SystemMessageMetadata,
  UploadTask,
  VPResponsePresentedCredential,
} from '@src/model'
import { InvitationState } from '@src/model/InvitationState'
import { CredentialMainInfo } from '@src/services/agent/display'

const CURRENT_REALM_SCHEMA_VERSION = 19

export const getRealmConfig = (encryptionKey: string): Realm.Configuration => {
  const realmConfig: Realm.Configuration = {
    encryptionKey: TypedArrayEncoder.fromHex(encryptionKey),
    path: `${walletDirectoryPath}/main.realm`,
    schema: [ChatEntry, ChatThread, UploadTask, CacheRecord],
    schemaVersion: CURRENT_REALM_SCHEMA_VERSION,
    onMigration,
  }
  return realmConfig
}

const onMigration = (oldRealm: Realm, newRealm: Realm) => {
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
    if (oldRealm.schemaVersion < 18) {
      newThreads[i].lastActivityAt = oldThreads[i].lastActivityAt ?? oldThreads[i].createdAt
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
  if (oldRealm.schemaVersion <= 18) {
    const oldUploadTask = oldRealm.objects<UploadTask>('UploadTask')
    const newUploadTasks = newRealm.objects<UploadTask>('UploadTask')
    for (let i = 0; i < oldUploadTask.length; i++) {
      newUploadTasks[i].fileId = oldUploadTask[i].fileId
      newUploadTasks[i].mediaRecordIds = oldUploadTask[i].mediaRecordIds
      newUploadTasks[i].state = oldUploadTask[i].state
      if (oldUploadTask[i].chunks.length) {
        const newChunks = oldUploadTask[i].chunks.map(item => {
          const chunk = JSON.parse(item) as { id: string; filePath: string; state: 'pending' | 'finished' }
          return chunk.filePath
        })
        newUploadTasks[i].chunks = newChunks
      }
    }
  }
}
