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
  download,
  exist,
} from 'react-native-cloud-store'

import { BACKUP_NAME, BACKUP_ZIP_FILE_PATH, existsBackupFile } from '../utils/walletBackUpUtils'

import { BackupInfoHandler, RestoreProgress, restoreProgressInitialValues } from './backup'
import { ICloudBackupInfo, useGlobalBuildBackup } from './providers/BuildBackupProvider'
import { useAppState } from './useAppState'

import { logError } from '@2060/utils'
import { copyFile } from '@2060/utils/RNFS'

export const useICloud = () => {
  const iCloudBackupFolderPath = PathUtils.join(defaultICloudContainerPath ?? '', 'Documents')
  const backupICloudPath = `${iCloudBackupFolderPath}/${BACKUP_NAME}`
  const [isCloudAvailable, setIsCloudAvailable] = useState(false)
  const [backupInfoHandler, setBackupInfoHandler] = useState<BackupInfoHandler>({ isFetching: false })
  const { isAppActive } = useAppState()
  const { globalUploadFileToIcloud } = useGlobalBuildBackup()

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
    if (isCloudAvailable && !backupInfoHandler.backup) checkBackup()
  }, [isCloudAvailable, isAppActive])

  const existsBackup = async (): Promise<boolean> => {
    const info = await getBackupInfo()
    return info.exists ?? false
  }

  const getBackupInfo = async (): Promise<ICloudBackupInfo> => {
    setBackupInfoHandler({ isFetching: true })
    try {
      const info = await query(backupICloudPath)
      setBackupInfoHandler({
        isFetching: false,
        backup: info.isInICloud
          ? {
              size: `${info.fileSize}`,
              modifyDate: info.modifyTimestamp,
            }
          : undefined,
      })
      return {
        exists: info.isInICloud ?? false,
        lastModifiedDate: info.modifyTimestamp ? new Date(info.modifyTimestamp).toISOString() : undefined,
        size: info.fileSize,
      }
    } catch (error) {
      setBackupInfoHandler({ isFetching: false, error: true })
      logError('Error getting file info', error)
      return { exists: false }
    }
  }

  const uploadFileToIcloud = async () => {
    if (await existsBackup()) await unlink(backupICloudPath)
    else createDir(iCloudBackupFolderPath)
    globalUploadFileToIcloud({ backupICloudPath, getBackupInfo })
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
    backupInfoHandler,
    uploadFileToIcloud,
    downloadBackup,
  }
}
