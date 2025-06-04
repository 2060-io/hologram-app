import { TypedArrayEncoder } from '@credo-ts/core'
import { useNavigation, useIsFocused, ParamListBase } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useEffect, useState } from 'react'

import { version } from '../../package.json'

import { BackupState } from './backup'
import { backupStateInitialValues } from './providers/BuildBackupProvider'

import { useMobileAgent } from '@2060/hooks/agent/MobileAgentProvider'
import { useLocalRealm } from '@2060/hooks/providers/RealmProvider'
import { ChatEntry, ChatThread, CacheRecord } from '@2060/model'
import {
  setStorageData,
  getStorageData,
  BACKUP_INCLUDES_MEDIA_PERSIST_KEY,
} from '@2060/services/localStorage'
import { logError } from '@2060/utils'
import { writeFile } from '@2060/utils/RNFS'
import * as BackupUtils from '@2060/utils/walletBackUpUtils'

type Props = {
  uploadBackup: (fileToUploadLocation: string) => Promise<void>
  setBackupState: React.Dispatch<React.SetStateAction<BackupState>>
}

export const useBuildBackup = ({ uploadBackup, setBackupState }: Props) => {
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

  const abortRetryBackup = () => setBackupState({ ...backupStateInitialValues })

  const startBackupProcess = async () => {
    setBackupState({ ...backupStateInitialValues, isBuildingBackup: true })
    await BackupUtils.deleteBackupDirectory()
    await BackupUtils.createBackupDirectory()
    const backupKey = (await BackupUtils.getBackupKey()) ?? ''
    await createWalletFile(backupKey)
    createChatsFile(backupKey)
    await createManifest()

    const zipPath = await BackupUtils.zipBackup(includeVideos)
    if (zipPath) {
      uploadBackup(zipPath)
    } else {
      setBackupState(prev => ({
        ...backupStateInitialValues,
        error: prev.error,
        isBuildingBackup: false,
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
