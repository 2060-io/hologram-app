import React, { useState, useEffect } from 'react'
import {
  defaultICloudContainerPath,
  PathUtils,
  registerICloudIdentityDidChangeEvent,
  registerGlobalUploadEvent,
  registerGlobalDownloadEvent,
  isICloudAvailable,
  query,
  unlink,
  createDir,
  upload,
  download,
  exist,
} from 'react-native-cloud-store'

import { BACKUP_NAME, BACKUP_ZIP_FILE_PATH, existsBackupFile } from '../utils/walletBackUpUtils'

import {
  BackupHandler,
  BackupProgressProps,
  OnBackupFinish,
  RestoreProgress,
  restoreProgressInitialValues,
} from './backup'
import { useAppState } from './useAppState'

import { logError } from '@2060/utils'
import { copyFile } from '@2060/utils/RNFS'

export const useICloud = () => {
  const iCloudBackupFolderPath = PathUtils.join(defaultICloudContainerPath ?? '', 'Documents')
  const backupICloudPath = `${iCloudBackupFolderPath}/${BACKUP_NAME}`
  const [isCloudAvailable, setIsCloudAvailable] = useState(false)
  const [backupHandler, setBackupHandler] = useState<BackupHandler>({ isFetching: false })
  const { isAppActive } = useAppState()

  useEffect(() => {
    const iCloudIdentityChangeEvent = registerICloudIdentityDidChangeEvent()
    const uploadEvent = registerGlobalUploadEvent()
    const downloadEvent = registerGlobalDownloadEvent()
    return () => {
      iCloudIdentityChangeEvent?.remove()
      uploadEvent?.remove()
      downloadEvent?.remove()
    }
  }, [])

  useEffect(() => {
    const isIcloudAvailable = async () => {
      try {
        const available = await isICloudAvailable()
        setIsCloudAvailable(available)
      } catch (error) {
        logError('Error getting if iCloud is available', error)
      }
    }
    isAppActive && isIcloudAvailable()
  }, [isAppActive])

  useEffect(() => {
    const checkBackup = async () => {
      await getBackupInfo()
    }
    if (isCloudAvailable && !backupHandler.backup) checkBackup()
  }, [isCloudAvailable, isAppActive])

  const existsBackup = async (): Promise<boolean> => {
    const info = await query(backupICloudPath)
    return Boolean(info.isInICloud)
  }

  const getBackupInfo = async () => {
    setBackupHandler({ isFetching: true })
    try {
      const info = await query(backupICloudPath)
      setBackupHandler({
        isFetching: false,
        backup:
          info.fileSize && info.modifyTimestamp
            ? {
                size: `${info.fileSize}`,
                modifyDate: info.modifyTimestamp,
              }
            : undefined,
      })
    } catch (error) {
      setBackupHandler({ isFetching: false, error: true })
      logError('Error getting file info', error)
      return { exists: false }
    }
  }

  const uploadFileToIcloud =
    (setUploadProgress: React.Dispatch<React.SetStateAction<BackupProgressProps>>) =>
    async (
      fileToUploadLocation: string,
      onBackupUploadSuccess: OnBackupFinish,
      onBackupUploadFailure: (error: string) => void,
    ) => {
      try {
        if (await existsBackup()) await unlink(backupICloudPath)
        else createDir(iCloudBackupFolderPath)

        upload(fileToUploadLocation, backupICloudPath, {
          onProgress(data) {
            setUploadProgress(prev => ({ ...prev, progress: data?.progress }))
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

  const downloadBackup = (setRestoreProgress: React.Dispatch<React.SetStateAction<RestoreProgress>>) => () =>
    new Promise(async resolve => {
      try {
        // File already downloaded locally in files app
        if (await exist(backupICloudPath)) {
          const alreadyDownloadBackup = await existsBackupFile()
          if (!alreadyDownloadBackup) {
            await copyFile(backupICloudPath, BACKUP_ZIP_FILE_PATH)
          }
          resolve(true)
        } else {
          // Need to download the file
          await download(backupICloudPath, {
            onProgress(data) {
              const progressLessOne = data?.progress ? data?.progress - 1 : data?.progress
              setRestoreProgress(prev => ({ ...prev, progress: progressLessOne }))
              if (data?.progress === 100) {
                copyFile(backupICloudPath, BACKUP_ZIP_FILE_PATH).then(_ => resolve(true))
              }
            },
          })
        }
      } catch (error) {
        setRestoreProgress({ ...restoreProgressInitialValues, error: `${error}` })
        resolve(false)
      }
    })

  return {
    isCloudAvailable,
    backupHandler,
    uploadFileToIcloud,
    downloadBackup,
  }
}
