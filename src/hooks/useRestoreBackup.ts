import { CommonActions, useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RestoreProgress, restoreProgressInitialValues } from './backup'

import { AgentActionType, useAgentActionQueue } from '@src/hooks/agent'
import { useMobileAgent } from '@src/hooks/agent/MobileAgentProvider'
import { SavePushNotificationDeviceInfoParameters } from '@src/hooks/agent/actions/types'
import { useLocalRealm } from '@src/hooks/providers/RealmProvider'
import { useWallet } from '@src/hooks/useWallet'
import { KeyChainService, createAndStoreEncryptedKey } from '@src/services/keys'
import { logError } from '@src/utils'
import { deleteDir, makeDirectory, walletDirectoryPath } from '@src/utils/RNFS'
import { getFcmDeviceToken, requestNotificationsPermission } from '@src/utils/pushNotificationsUtils'
import * as BackupUtils from '@src/utils/walletBackUpUtils'

type Props = {
  restoreProgress: RestoreProgress
  setRestoreProgress: React.Dispatch<React.SetStateAction<RestoreProgress>>
  downloadBackup: () => Promise<boolean | unknown>
}

export const useRestoreBackup = ({ restoreProgress, setRestoreProgress, downloadBackup }: Props) => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { agent } = useMobileAgent()
  const { openWallet } = useWallet()
  const { importAndOpenRealm } = useLocalRealm()
  const { addAgentActionToQueue } = useAgentActionQueue()
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [showConfirmLeaveScreen, setShowConfirmLeaveScreen] = useState(false)

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        const isInitialState = !restoreProgress.isDownloadingBackUp && !restoreProgress.done
        const wantsToNavigateToHome = e.data.action.type === 'RESET'
        const canLeave = isInitialState || wantsToNavigateToHome
        if (canLeave) {
          return
        }
        restoreProgress.isDownloadingBackUp && setShowConfirmLeaveScreen(true)
        e.preventDefault()
      }),
    [navigation, restoreProgress],
  )

  const closeConfirmLeaveScreen = () => setShowConfirmLeaveScreen(false)

  const abort = () => {
    restoreProgressToInitialValues()
    closeConfirmLeaveScreen()
    setTimeout(() => {
      navigation.goBack()
    }, 250)
  }

  const restore = async () => {
    setRestoreProgress({ ...restoreProgressInitialValues, isDownloadingBackUp: true })
    await BackupUtils.createBackupDirectory()
    const successfullyDownloadedBackup = await downloadBackup()
    if (successfullyDownloadedBackup) {
      await BackupUtils.unzipBackup()
      await BackupUtils.unzipMediaFiles()
      importWalletAndRealm()
    }
  }

  const importWalletAndRealm = async () => {
    if (!agent) {
      throw new Error('Agent not defined in BaseRestoreWalletBackup')
    }

    // A new wallet is created as soon as user presses "Skip, I want a new wallet" button, so
    // there is a possibility that a wallet is created without finishing sign-up process
    // (profile creation + mediation). A typical case where this happens is when there is no
    // network connection when signing-up.
    // If this is the case, when restarting the app it will show the same Sign Up main screen,
    // allowing to do a Restore process. So we'll reach this point with an 'afj' wallet already
    // created. We need to close the wallet/shutdown the agent in order to be ables to import it.
    if (agent.isInitialized) await agent.shutdown()

    const backupKey = await BackupUtils.setBackupKey(recoveryPassword)
    const successfullyWalletImported = await importWallet(backupKey)
    if (successfullyWalletImported) {
      onSuccessFinish(backupKey)
    } else {
      await BackupUtils.deleteBackupKey()
    }
  }

  const importWallet = async (backupKey: string) => {
    try {
      if (!agent) throw new Error('Agent')
      const key = await createAndStoreEncryptedKey(KeyChainService.AfjWallet)

      // make sure wallet directories exist (TODO: centralize this process somewhere...)
      await makeDirectory(walletDirectoryPath)

      // Reconfigure askar store config with this new key
      agent.modules.askar.config.store.key = key

      // Create empty store and import data
      await agent.modules.askar.provisionStore()
      await agent.modules.askar.importStore({
        importFromStore: {
          id: 'afj',
          key: backupKey,
          database: { type: 'sqlite', config: { path: BackupUtils.AFJ_BACKUP_FILE_PATH } },
        },
      })

      return true
    } catch (error) {
      await deleteDir(walletDirectoryPath)
      setRestoreProgress(prev => ({
        ...prev,
        isDownloadingBackUp: false,
        error: t('signUp.wrongRestoreWalletPassword'),
      }))
      logError('Error importing wallet file from restore', error)
      return false
    }
  }

  const restoreProgressToInitialValues = () => setRestoreProgress(restoreProgressInitialValues)

  const onSuccessFinish = async (backupKey: string) => {
    await importAndOpenRealm(BackupUtils.REALM_BACKUP_FILE_PATH, backupKey)
    await openWallet()
    await handleNotificationsPermission()
    setRestoreProgress(prev => ({ ...prev, isDownloadingBackUp: false, done: true, progress: 100 }))
    await BackupUtils.deleteBackupDirectory()
  }

  const updateNotificationInfo = useCallback(async () => {
    if (!agent) return

    const connection = await agent.didcomm.mediationRecipient.findDefaultMediatorConnection()
    if (!connection) return
    const deviceToken = await getFcmDeviceToken()
    const parameters: SavePushNotificationDeviceInfoParameters = {
      connectionId: connection.id,
      deviceToken,
    }
    addAgentActionToQueue({ type: AgentActionType.SavePushNotificationDeviceInfo, parameters })
  }, [agent])

  const handleNotificationsPermission = async () => {
    const areNotificationsAllowed = await requestNotificationsPermission()
    if (areNotificationsAllowed) await updateNotificationInfo()
  }

  const goToHomeScreen = async () => {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }))
  }

  return {
    recoveryPassword,
    setRecoveryPassword,
    showConfirmLeaveScreen,
    closeConfirmLeaveScreen,
    abort,
    restore,
    restoreProgressToInitialValues,
    goToHomeScreen,
    navigation,
  }
}
