import { TypedArrayEncoder } from '@credo-ts/core'
import { useNavigation, useIsFocused, ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useEffect, useState } from 'react'

import { version } from '../../package.json'

import { BackupProgressProps, OnBackupFinish } from './backup'

import { useMobileAgent } from '@2060/hooks/agent/MobileAgentProvider'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntry, ChatThread, ImageRecord } from '@2060/model'
import {
  setStorageData,
  getStorageData,
  BACKUP_INCLUDES_MEDIA_PERSIST_KEY,
} from '@2060/services/localStorage'
import { logError } from '@2060/utils'
import { writeFile } from '@2060/utils/RNFS'
import * as BackupUtils from '@2060/utils/walletBackUpUtils'

type Props = {
  backupProgressInitialValues: BackupProgressProps
  uploadBackup: (
    fileToUploadLocation: string,
    onBackupUploadSuccess: OnBackupFinish,
    onBackupUploadFailure: (error: string) => void,
  ) => Promise<void>
  uploadProgress: BackupProgressProps
  setUploadProgress: React.Dispatch<React.SetStateAction<BackupProgressProps>>
}

export const useBuildBackup = ({
  backupProgressInitialValues,
  uploadBackup,
  uploadProgress,
  setUploadProgress,
}: Props) => {
  const [includeVideos, setIncludeVideos] = useState<boolean>(false)
  const [backupPassword, setBackupPassword] = useState<string | undefined>('')
  const [showConfirmLeaveScreen, setShowConfirmLeaveScreen] = useState(false)
  const { agent } = useMobileAgent()
  const { realm } = useLocalRealm()
  const navigation: StackNavigationProp<ParamListBase> = useNavigation()
  const isFocused = useIsFocused()

  useEffect(() => {
    const getStoredConfig = async () => {
      const storedIncludeVideos = await getStorageData(BACKUP_INCLUDES_MEDIA_PERSIST_KEY)
      setIncludeVideos(Boolean(storedIncludeVideos))
    }
    getStoredConfig()
  }, [])

  useEffect(() => {
    const getStoredBackupPassword = async () => {
      const storedBackup = await BackupUtils.getBackupKey()
      setBackupPassword(storedBackup)
    }
    isFocused && getStoredBackupPassword()
  }, [isFocused])

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        const canLeave = !uploadProgress.isUploadingBackup || e.data.action.type === 'GO_BACK'
        if (canLeave) {
          return
        }
        setShowConfirmLeaveScreen(true)
        e.preventDefault()
      }),
    [navigation, uploadProgress.isUploadingBackup],
  )

  const closeConfirmLeaveScreen = () => setShowConfirmLeaveScreen(false)

  const leaveScreen = async () => {
    closeConfirmLeaveScreen()
    navigation.goBack()
    await BackupUtils.deleteBackupDirectory()
  }

  const goToChangePassword = () => navigation.navigate('ChangeBackupPassword')

  const onToggleIncludeVideos = () => {
    setIncludeVideos(!includeVideos)
    setStorageData(BACKUP_INCLUDES_MEDIA_PERSIST_KEY, !includeVideos)
  }

  const onBackupUploadSuccess = async () => {
    // Timeout is set to user sees in screen that backup progress reaches 100% done before update state
    setTimeout(() => {
      setUploadProgress({ ...backupProgressInitialValues, isUploadingBackup: false })
    }, 1000)
    await BackupUtils.deleteBackupDirectory()
  }

  const onBackupUploadFailure = async (error: string) => {
    setUploadProgress({ ...backupProgressInitialValues, error })
    await BackupUtils.deleteBackupDirectory()
  }

  const abortRetryBackup = () => setUploadProgress({ ...backupProgressInitialValues })

  const startBackupProcess = async () => {
    setUploadProgress({ ...backupProgressInitialValues, isUploadingBackup: true })
    await BackupUtils.deleteBackupDirectory()
    await BackupUtils.createBackupDirectory()
    const backupKey = (await BackupUtils.getBackupKey()) ?? ''
    await createWalletFile(backupKey)
    createChatsFile(backupKey)
    await createManifest()

    const zipPath = await BackupUtils.zipBackup(includeVideos)
    if (zipPath) {
      uploadBackup(zipPath, onBackupUploadSuccess, onBackupUploadFailure)
    } else {
      setUploadProgress(prev => ({
        ...backupProgressInitialValues,
        error: prev.error,
        isUploadingBackup: false,
      }))
    }
  }

  const createWalletFile = async (backupKey: string) => {
    try {
      await agent?.wallet.export({
        key: backupKey,
        path: BackupUtils.AFJ_BACKUP_FILE_PATH,
      })
    } catch (error) {
      setUploadProgress(prev => ({ ...prev, error: `${error}` }))
      logError('Error creating wallet file', error)
    }
  }

  const createChatsFile = (backupKey: string) => {
    try {
      realm?.writeCopyTo({
        encryptionKey: TypedArrayEncoder.fromHex(backupKey),
        path: BackupUtils.REALM_BACKUP_FILE_PATH,
        // FIXME: Figure out why writeCopyTo is ignoring schema parameter and exporting everything
        schema: [ChatEntry, ChatThread, ImageRecord],
      })
    } catch (error) {
      setUploadProgress(prev => ({ ...prev, error: `${error}` }))
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

  return {
    backupPassword,
    startBackupProcess,
    abortRetryBackup,
    goToChangePassword,
    includeVideos,
    onToggleIncludeVideos,
    showConfirmLeaveScreen,
    closeConfirmLeaveScreen,
    leaveScreen,
  }
}
