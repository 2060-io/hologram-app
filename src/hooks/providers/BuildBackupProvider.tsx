import axios from 'axios'
import React, { createContext, PropsWithChildren, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { upload } from 'react-native-cloud-store'
import { nativeReadChunk } from 'react-native-local-native-modules'

import { BackupState } from '../backup'

import { log, logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'
import { deleteBackupDirectory } from '@2060/utils/walletBackUpUtils'

export interface ICloudBackupInfo {
  exists: boolean
  path?: string
  size?: number
  lastModifiedDate?: string
}

type UploadFileToIcloud = {
  backupICloudPath: string
  fileToUploadLocation: string
  getBackupInfo: () => Promise<ICloudBackupInfo>
}

type UploadFileToGoogleDrive = {
  fileToUploadSize: number
  fileToUploadLocation: string
  chunkUploadUrl: string
  getBackupInfo: (fileId: string) => Promise<void>
  initializeGoogleDrive: () => Promise<void>
  deletePreviousBackups: (justCreatedId: string) => Promise<void>
}

type BuildBackupInterface = {
  globalUploadFileToIcloud: (args: UploadFileToIcloud) => void
  globalUploadFileToGoogleDrive: (args: UploadFileToGoogleDrive) => void
  backupState: BackupState
  setBackupState: React.Dispatch<React.SetStateAction<BackupState>>
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

export const BuildBackupProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation()
  const [backupState, setBackupState] = useState<BackupState>(backupStateInitialValues)

  const globalUploadFileToIcloud = ({
    backupICloudPath,
    fileToUploadLocation,
    getBackupInfo,
  }: UploadFileToIcloud) => {
    try {
      upload(fileToUploadLocation, backupICloudPath, {
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
    fileToUploadSize,
    fileToUploadLocation,
    chunkUploadUrl,
    initializeGoogleDrive,
    getBackupInfo,
    deletePreviousBackups,
  }: UploadFileToGoogleDrive) => {
    try {
      const TWO_MB = 256 * 1024 * 4 * 2
      const UPLOAD_SIZE_PER_CHUNK = TWO_MB
      const numberOfChunks = Math.ceil(fileToUploadSize / UPLOAD_SIZE_PER_CHUNK)
      let start = 0
      for (let i = 0; i < numberOfChunks; i++) {
        const chunkSize =
          i + 1 < numberOfChunks ? UPLOAD_SIZE_PER_CHUNK : fileToUploadSize % UPLOAD_SIZE_PER_CHUNK
        const fileChunkBase64 = await nativeReadChunk(fileToUploadLocation, start, chunkSize)
        const base64ToBuffer = base64ToArrayBuffer(fileChunkBase64)
        const end = start + base64ToBuffer.length - 1
        const contentRange = `bytes ${start}-${end}/${fileToUploadSize}`
        const chunkUploadResponse = await axios({
          method: 'PUT',
          url: chunkUploadUrl,
          headers: { 'Content-Range': contentRange },
          data: base64ToBuffer,
        }).catch(() => log(`Uploaded backup file chunk ${i + 1} of ${numberOfChunks}`))
        const response = typeof chunkUploadResponse === 'object' ? chunkUploadResponse.data : null
        const progress = Number(((end / fileToUploadSize) * 100).toFixed())
        setBackupState(prev => ({ ...prev, progress }))
        if (response) {
          await initializeGoogleDrive()
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

  return (
    <BuildBackupContext.Provider
      value={{
        globalUploadFileToIcloud,
        globalUploadFileToGoogleDrive,
        backupState,
        setBackupState,
      }}
    >
      {children}
    </BuildBackupContext.Provider>
  )
}
