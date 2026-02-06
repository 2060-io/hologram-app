import { TypedArrayEncoder } from '@credo-ts/core'
import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper'
import axios from 'axios'
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { upload } from 'react-native-cloud-store'
import { read, stat } from 'react-native-fs'

import { version } from '../../../package.json'
import { useMobileAgent } from '../agent'
import { BackupState } from '../backup'

import { useLocalRealm } from './RealmProvider'

import { CacheRecord, ChatEntry, ChatThread } from '@2060/model'
import {
  BACKUP_INCLUDES_MEDIA_PERSIST_KEY,
  getStorageData,
  setStorageData,
} from '@2060/services/localStorage'
import { log, logError } from '@2060/utils'
import { writeFile } from '@2060/utils/RNFS'
import { toast } from '@2060/utils/toast'
import { BACKUP_NAME, deleteBackupDirectory } from '@2060/utils/walletBackUpUtils'
import * as BackupUtils from '@2060/utils/walletBackUpUtils'

export interface ICloudBackupInfo {
  exists: boolean
  path?: string
  size?: number
  lastModifiedDate?: string
}

type UploadFileToIcloud = {
  backupICloudPath: string
  getBackupInfo: () => Promise<void>
}

type UploadFileToGoogleDrive = {
  googleDriveConnection: GDrive | null
  getBackupInfo: (fileId: string) => Promise<void>
  deletePreviousBackups: (justCreatedId: string) => Promise<void>
}

type BuildBackupInterface = {
  globalUploadFileToIcloud: (args: UploadFileToIcloud) => void
  globalUploadFileToGoogleDrive: (args: UploadFileToGoogleDrive) => void
  backupState: BackupState
  includeVideos: boolean
  onToggleIncludeVideos: () => void
  abortRetryBackup: () => void
}

export const useGlobalBuildBackup = () => {
  const buildBackupContext = useContext(BuildBackupContext)
  if (!buildBackupContext) {
    throw new Error('useBuildBackup must be used within a BuildBackupProvider')
  }
  return buildBackupContext
}
const BuildBackupContext = createContext<BuildBackupInterface | undefined>(undefined)

export const backupStateInitialValues: BackupState = {
  progress: 0,
  isBuildingBackup: false,
  error: '',
}

const base64ToArrayBuffer = (base64: string) => {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

const TWO_MB = 1024 * 1024 * 2

export const BuildBackupProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const [backupState, setBackupState] = useState<BackupState>(backupStateInitialValues)
  const [includeVideos, setIncludeVideos] = useState<boolean>(false)

  useEffect(() => {
    const getStoredConfig = async () => {
      const storedIncludeVideos = await getStorageData(BACKUP_INCLUDES_MEDIA_PERSIST_KEY)
      setIncludeVideos(Boolean(storedIncludeVideos))
    }
    getStoredConfig()
  }, [])

  const onToggleIncludeVideos = () => {
    setIncludeVideos(!includeVideos)
    setStorageData(BACKUP_INCLUDES_MEDIA_PERSIST_KEY, !includeVideos)
  }

  const startBackupProcess = useCallback(async () => {
    setBackupState({ ...backupStateInitialValues, isBuildingBackup: true })
    await BackupUtils.deleteBackupDirectory()
    await BackupUtils.createBackupDirectory()
    const backupKey = (await BackupUtils.getBackupKey()) ?? ''
    await createWalletFile(backupKey)
    createChatsFile(backupKey)
    await createManifest()
    const zipPath = await BackupUtils.zipBackup(includeVideos)
    if (zipPath) {
      return zipPath
    } else {
      setBackupState(prev => ({
        ...backupStateInitialValues,
        error: prev.error,
        isBuildingBackup: false,
      }))
      return null
    }
  }, [includeVideos])

  const createWalletFile = async (backupKey: string) => {
    try {
      await agent?.modules.askar.exportStore({
        exportToStore: {
          id: 'afj',
          key: backupKey,
          database: { type: 'sqlite', config: { path: BackupUtils.AFJ_BACKUP_FILE_PATH } },
        },
      })
    } catch (error) {
      setBackupState(prev => ({ ...prev, error: `${error}` }))
      logError('Error creating wallet file', error)
    }
  }

  const createChatsFile = (backupKey: string) => {
    try {
      realm?.writeCopyTo({
        encryptionKey: TypedArrayEncoder.fromHex(backupKey),
        path: BackupUtils.REALM_BACKUP_FILE_PATH,
        // FIXME: Figure out why writeCopyTo is ignoring schema parameter and exporting everything
        schema: [ChatEntry, ChatThread, CacheRecord],
      })
    } catch (error) {
      setBackupState(prev => ({ ...prev, error: `${error}` }))
      logError('Error creating realm chats file', error)
    }
  }

  const createManifest = async () => {
    const info = {
      schemaVersion: 1,
      appVersion: version,
    }

    await writeFile(BackupUtils.BACKUP_MANIFEST_FILE_PATH, JSON.stringify(info))
  }

  const globalUploadFileToIcloud = async ({ backupICloudPath, getBackupInfo }: UploadFileToIcloud) => {
    try {
      const backupFilePath = await startBackupProcess()
      if (!backupFilePath) return
      upload(backupFilePath, backupICloudPath, {
        onProgress(data) {
          setBackupState(prev => ({ ...prev, progress: data?.progress }))
          log(`Uploading backup progress ${data?.progress}`)
          if (data?.progress === 100) {
            onBackupUploadSuccess()
            // Timeout is set because after finish backup upload process to icloud drive it takes
            // a while to have metadata of file updated to fetch info of it again
            setTimeout(() => {
              getBackupInfo()
            }, 1000)
          }
        },
      })
    } catch (error) {
      onBackupUploadFailure(`${error}`)
      logError('Error uploading file to iCloud', error)
    }
  }

  const globalUploadFileToGoogleDrive = async ({
    googleDriveConnection,
    getBackupInfo,
    deletePreviousBackups,
  }: UploadFileToGoogleDrive) => {
    try {
      const backupFilePath = await startBackupProcess()
      if (!backupFilePath) return
      const fileToUploadInfo = await stat(backupFilePath)
      const fileToUploadSize = fileToUploadInfo.size
      const uploaderRequest = await googleDriveConnection?.files
        .newResumableUploader()
        .setDataType('application/zip')
        .setShouldUseMultipleRequests(true)
        .setRequestBody({ name: BACKUP_NAME, parents: ['appDataFolder'] })
        .execute()
      uploaderRequest.setContentLength(fileToUploadInfo.size)
      const chunkUploadUrl = uploaderRequest.location
      const UPLOAD_SIZE_PER_CHUNK = TWO_MB
      const numberOfChunks = Math.ceil(fileToUploadSize / UPLOAD_SIZE_PER_CHUNK)
      let start = 0
      for (let i = 0; i < numberOfChunks; i++) {
        const chunkSize =
          i + 1 < numberOfChunks ? UPLOAD_SIZE_PER_CHUNK : fileToUploadSize % UPLOAD_SIZE_PER_CHUNK
        const chunk = await read(backupFilePath, chunkSize, start, 'base64')
        const buffer = base64ToArrayBuffer(chunk)
        const end = start + buffer.length - 1
        const contentRange = `bytes ${start}-${end}/${fileToUploadSize}`
        const chunkUploadResponse = await axios({
          method: 'PUT',
          url: chunkUploadUrl,
          headers: { 'Content-Range': contentRange },
          data: buffer,
        }).catch(() => log(`Uploaded backup file chunk ${i + 1} of ${numberOfChunks}`))
        const response = typeof chunkUploadResponse === 'object' ? chunkUploadResponse.data : null
        const progress = Number(((end / fileToUploadSize) * 100).toFixed())
        setBackupState(prev => ({ ...prev, progress }))
        if (response) {
          setTimeout(() => {
            getBackupInfo(response.id)
            deletePreviousBackups(response.id)
          }, 500)
        }
        start = end + 1
      }
      onBackupUploadSuccess()
    } catch (error) {
      onBackupUploadFailure(`${error}`)
      logError('Error uploading file to google drive', `${error}`)
    }
  }

  const onBackupUploadSuccess = async () => {
    toast({ type: 'success', message: t('settings.buildBackupSuccessfully') })
    // Timeout is set to user sees in screen that backup progress reaches 100% done before update state
    setTimeout(() => {
      setBackupState({ ...backupStateInitialValues })
    }, 1000)
    await deleteBackupDirectory()
  }

  const onBackupUploadFailure = async (error: string) => {
    toast({ type: 'error', message: t('settings.buildBackupError') })
    setBackupState({ ...backupStateInitialValues, error })
    await deleteBackupDirectory()
  }

  const abortRetryBackup = () => setBackupState({ ...backupStateInitialValues })

  return (
    <BuildBackupContext.Provider
      value={{
        globalUploadFileToIcloud,
        globalUploadFileToGoogleDrive,
        backupState,
        includeVideos,
        onToggleIncludeVideos,
        abortRetryBackup,
      }}
    >
      {children}
    </BuildBackupContext.Provider>
  )
}
