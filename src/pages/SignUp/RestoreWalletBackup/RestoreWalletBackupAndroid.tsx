import { useGoogleDrive } from '@src/hooks'
import { restoreProgressInitialValues } from '@src/hooks/backup'
import React, { useState } from 'react'
import BaseRestoreWalletBackup from './BaseRestoreWalletBackup'
import { RestoreProgressProps } from './RestoreWalletBackupProps'

const RestoreWalletBackupAndroid = () => {
  const { isCloudAvailable, backupHandler, downloadBackup, selectAccount, selectedGoogleAccount } = useGoogleDrive()
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgressProps>(restoreProgressInitialValues)

  return (
    <BaseRestoreWalletBackup
      isCloudAvailable={isCloudAvailable}
      backupHandler={backupHandler}
      downloadBackup={downloadBackup(setRestoreProgress)}
      restoreProgress={restoreProgress}
      setRestoreProgress={setRestoreProgress}
      selectAccount={selectAccount}
      selectedGoogleAccount={selectedGoogleAccount}
    />
  )
}

export default RestoreWalletBackupAndroid
