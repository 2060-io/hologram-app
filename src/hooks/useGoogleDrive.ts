import { GDrive, ListQueryBuilder } from '@robinbobin/react-native-google-drive-api-wrapper'
import React, { useEffect, useState } from 'react'
import { downloadFile, stat } from 'react-native-fs'
import {
  nativeGDGetAccessToken,
  nativeGDSelectAccount,
  nativeGDAuthorize,
} from 'react-native-local-native-modules'

import { restoreProgressInitialValues, BackupInfoHandler, RestoreProgress } from './backup'
import { useGlobalBuildBackup } from './providers/BuildBackupProvider'

import {
  GOOGLE_ACCOUNT_BACKUP_PERSIST_KEY,
  getStorageData,
  setStorageData,
} from '@2060/services/localStorage'
import { log, logError } from '@2060/utils'
import { BACKUP_NAME, BACKUP_ZIP_FILE_PATH } from '@2060/utils/walletBackUpUtils'

global.Buffer ??= require('buffer').Buffer

type FilesProps = {
  id: string
}

export const useGoogleDrive = () => {
  const [googleDriveConnection, setGoogleDriveConnection] = useState<null | GDrive>(null)
  const [isCloudAvailable, setIsCloudAvailable] = useState(false)
  const [backupInfoHandler, setBackupInfoHandler] = useState<BackupInfoHandler>({ isFetching: false })
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string>()
  const { globalUploadFileToGoogleDrive } = useGlobalBuildBackup()

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
    const accessToken = await nativeGDGetAccessToken()
    googleDrive.accessToken = accessToken
    googleDrive.fetchCoercesTypes = true
    googleDrive.fetchRejectsOnHttpErrors = true
    googleDrive.fetchTimeout = 3000
    setGoogleDriveConnection(googleDrive)
  }

  const selectAccount = async () => {
    try {
      const newSelectedAccount = await nativeGDSelectAccount(selectedGoogleAccount)
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
      await nativeGDAuthorize(currentAccount)
      await initializeGoogleDrive()
      setIsCloudAvailable(true)
    } catch (error) {
      logError('GDriveAuthorization request error', error)
    }
  }

  const existsBackup = async () => {
    setBackupInfoHandler({ isFetching: true })
    try {
      const { files } = await googleDriveConnection?.files.list({
        q: new ListQueryBuilder().e('name', BACKUP_NAME).and().in('appDataFolder', 'parents'),
        spaces: 'appDataFolder',
      })
      const response = { exists: !!files?.length, backup: files?.[0] }
      if (!response.exists) setBackupInfoHandler({ isFetching: false })
      return response
    } catch (error) {
      setBackupInfoHandler({ isFetching: false, error: true })
      logError('Error checking if file exists in Google Drive', JSON.stringify(error))
      return { exists: false, backup: undefined }
    }
  }

  const getBackupInfo = async (fileId: string) => {
    setBackupInfoHandler({ isFetching: true })
    try {
      const info = await googleDriveConnection?.files.getMetadata(fileId, {
        fields: 'id, name, size, modifiedTime',
        spaces: ['appDataFolder'],
      })
      setBackupInfoHandler({
        isFetching: false,
        backup: {
          name: info.name,
          size: info.size,
          modifyDate: info.modifiedTime,
          downloadUrl: `https://www.googleapis.com/drive/v2/files/${fileId}?alt=media&source=downloadUrl`,
        },
      })
    } catch (error) {
      setBackupInfoHandler({ isFetching: false, error: true })
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

  const uploadFileToGoogleDrive = async (fileToUploadLocation: string) => {
    const fileToUploadInfo = await stat(fileToUploadLocation)
    const uploaderRequest = await googleDriveConnection?.files
      .newResumableUploader()
      .setDataType('application/zip')
      .setShouldUseMultipleRequests(true)
      .setRequestBody({ name: BACKUP_NAME, parents: ['appDataFolder'] })
      .execute()
    uploaderRequest.setContentLength(fileToUploadInfo.size)
    globalUploadFileToGoogleDrive({
      fileToUploadSize: fileToUploadInfo.size,
      fileToUploadLocation,
      chunkUploadUrl: uploaderRequest.location,
      getBackupInfo,
      initializeGoogleDrive,
      deletePreviousBackups,
    })
  }

  const downloadBackup =
    (setRestoreProgress: React.Dispatch<React.SetStateAction<RestoreProgress>>) => async () => {
      try {
        const { promise } = downloadFile({
          fromUrl: backupInfoHandler?.backup?.downloadUrl ?? '',
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
    backupInfoHandler,
    uploadFileToGoogleDrive,
    downloadBackup,
    selectAccount,
    selectedGoogleAccount,
  }
}
