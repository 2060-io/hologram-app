import { GDrive, ListQueryBuilder } from '@robinbobin/react-native-google-drive-api-wrapper'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { downloadFile, stat } from 'react-native-fs'
import {
  googleDriveAuthorize,
  googleDriveGetAccessToken,
  googleDriveSelectAccount,
  readChunk,
} from 'react-native-local-native-modules'

import {
  restoreProgressInitialValues,
  BackupHandler,
  OnBackupFinish,
  BackupProgressProps,
  RestoreProgress,
} from './backup'

import {
  GOOGLE_ACCOUNT_BACKUP_PERSIST_KEY,
  getStorageData,
  setStorageData,
} from '@2060/services/localStorage'
import { log, logError } from '@2060/utils'
import { BACKUP_NAME, BACKUP_ZIP_FILE_PATH } from '@2060/utils/walletBackUpUtils'

type FilesProps = {
  id: string
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

export const useGoogleDrive = () => {
  const [googleDriveConnection, setGoogleDriveConnection] = useState<null | GDrive>(null)
  const [isCloudAvailable, setIsCloudAvailable] = useState(false)
  const [backupHandler, setBackupHandler] = useState<BackupHandler>({ isFetching: false })
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string>()

  useEffect(() => {
    const setup = async () => {
      const storedGoogleAccount = await getStorageData(GOOGLE_ACCOUNT_BACKUP_PERSIST_KEY)
      setSelectedGoogleAccount(String(storedGoogleAccount))
      storedGoogleAccount ? authorize(String(storedGoogleAccount)) : selectAccount()
    }
    setup()
  }, [])

  useEffect(() => {
    const checkBackup = async () => {
      const { exists, backup } = await existsBackup()
      if (exists) getBackupInfo(backup.id)
    }
    isCloudAvailable && checkBackup()
  }, [isCloudAvailable])

  const initializeGoogleDrive = async () => {
    const googleDrive = new GDrive()
    const accessToken = await googleDriveGetAccessToken()
    googleDrive.accessToken = accessToken
    googleDrive.fetchCoercesTypes = true
    googleDrive.fetchRejectsOnHttpErrors = true
    googleDrive.fetchTimeout = 3000
    setGoogleDriveConnection(googleDrive)
  }

  const selectAccount = async () => {
    try {
      const newSelectedAccount = await googleDriveSelectAccount(selectedGoogleAccount)
      if (newSelectedAccount) {
        setSelectedGoogleAccount(newSelectedAccount)
        setStorageData(GOOGLE_ACCOUNT_BACKUP_PERSIST_KEY, newSelectedAccount)
        await authorize(newSelectedAccount)
      }
    } catch (error) {
      logError('GDrive Account Selection request error', error)
    }
  }

  const authorize = async (currentAccount: string) => {
    try {
      setIsCloudAvailable(false)
      await googleDriveAuthorize(currentAccount)
      await initializeGoogleDrive()
      setIsCloudAvailable(true)
    } catch (error) {
      logError('GDriveAuthorization request error', error)
    }
  }

  const existsBackup = async () => {
    setBackupHandler({ isFetching: true })
    try {
      const { files } = await googleDriveConnection?.files.list({
        q: new ListQueryBuilder().e('name', BACKUP_NAME).and().in('appDataFolder', 'parents'),
        spaces: 'appDataFolder',
      })
      const response = { exists: !!files?.length, backup: files?.[0] }
      if (!response.exists) setBackupHandler({ isFetching: false })
      return response
    } catch (error) {
      setBackupHandler({ isFetching: false, error: true })
      logError('Error checking if file exists in Google Drive', JSON.stringify(error))
      return { exists: false, backup: undefined }
    }
  }

  const getBackupInfo = async (fileId: string) => {
    setBackupHandler({ isFetching: true })
    try {
      const info = await googleDriveConnection?.files.getMetadata(fileId, {
        fields: 'id, name, size, modifiedTime',
        spaces: ['appDataFolder'],
      })
      setBackupHandler({
        isFetching: false,
        backup: {
          name: info.name,
          size: info.size,
          modifyDate: info.modifiedTime,
          downloadUrl: `https://www.googleapis.com/drive/v2/files/${fileId}?alt=media&source=downloadUrl`,
        },
      })
    } catch (error) {
      setBackupHandler({ isFetching: false, error: true })
      logError('Error getting back up info', JSON.stringify(error))
    }
  }

  const deletePreviousBackups = async (justCreatedId: string) => {
    try {
      const { files } = await googleDriveConnection?.files.list({
        q: new ListQueryBuilder().e('name', BACKUP_NAME).and().in('appDataFolder', 'parents'),
        spaces: 'appDataFolder',
      })
      const previousBackupToDelete = files?.filter(({ id }: FilesProps) => id !== justCreatedId)
      previousBackupToDelete.forEach(async ({ id }: FilesProps) => {
        await googleDriveConnection?.files.delete(id)
      })
    } catch (error) {
      logError('Error deleting backups', JSON.stringify(error))
    }
  }

  const uploadFileToGoogleDrive =
    (setUploadProgress: React.Dispatch<React.SetStateAction<BackupProgressProps>>) =>
    async (
      fileToUploadLocation: string,
      onBackupUploadSuccess: OnBackupFinish,
      onBackupUploadFailure: (error: string) => void,
    ) => {
      try {
        const TWO_MB = 256 * 1024 * 4 * 2
        const UPLOAD_SIZE_PER_CHUNK = TWO_MB
        const fileToUploadInfo = await stat(fileToUploadLocation)
        const numberOfChunks = Math.ceil(fileToUploadInfo.size / UPLOAD_SIZE_PER_CHUNK)
        const uploaderRequest = await googleDriveConnection?.files
          .newResumableUploader()
          .setDataType('application/zip')
          .setShouldUseMultipleRequests(true)
          .setRequestBody({ name: BACKUP_NAME, parents: ['appDataFolder'] })
          .execute()
        uploaderRequest.setContentLength(fileToUploadInfo.size)
        let start = 0
        for (let i = 0; i < numberOfChunks; i++) {
          const chunkSize =
            i + 1 < numberOfChunks ? UPLOAD_SIZE_PER_CHUNK : fileToUploadInfo.size % UPLOAD_SIZE_PER_CHUNK
          const fileChunkBase64 = await readChunk(fileToUploadLocation, start, chunkSize)
          const base64ToBuffer = base64ToArrayBuffer(fileChunkBase64)
          const end = start + base64ToBuffer.length - 1
          const contentRange = `bytes ${start}-${end}/${fileToUploadInfo.size}`
          const chunkResponse = await axios({
            method: 'PUT',
            url: uploaderRequest.location,
            headers: { 'Content-Range': contentRange },
            data: base64ToBuffer,
          }).catch(() => log('Uploading backup file chunk'))
          const response = typeof chunkResponse === 'object' ? chunkResponse.data : null
          const progress = Number(((end / fileToUploadInfo.size) * 100).toFixed())
          setUploadProgress(prev => ({ ...prev, progress }))
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

  const downloadBackup =
    (setRestoreProgress: React.Dispatch<React.SetStateAction<RestoreProgress>>) => async () => {
      try {
        const { promise } = downloadFile({
          fromUrl: backupHandler?.backup?.downloadUrl ?? '',
          progressInterval: 5000,
          headers: { Authorization: `Bearer ${googleDriveConnection?.accessToken}` },
          toFile: BACKUP_ZIP_FILE_PATH,
          begin: () => log('Download of backup file begin'),
          progress: res => {
            const progress = Number(((res.bytesWritten / res.contentLength) * 100).toFixed())
            const progressLessOne = progress ? progress - 1 : progress
            setRestoreProgress(prev => ({ ...prev, progress: progressLessOne }))
            log(`Downloading backup progress: ${progress}%`)
          },
        })
        await promise
        return true
      } catch (error) {
        setRestoreProgress({ ...restoreProgressInitialValues, error: `${error}` })
        return false
      }
    }

  return {
    isCloudAvailable,
    backupHandler,
    uploadFileToGoogleDrive,
    downloadBackup,
    selectAccount,
    selectedGoogleAccount,
  }
}
