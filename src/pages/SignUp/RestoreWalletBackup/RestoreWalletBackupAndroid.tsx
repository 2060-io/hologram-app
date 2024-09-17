import React, { useState } from 'react'

import BaseRestoreWalletBackup from './BaseRestoreWalletBackup'
import { RestoreProgressProps } from './RestoreWalletBackupProps'

import { useGoogleDrive } from '@2060/hooks'
import { restoreProgressInitialValues } from '@2060/hooks/backup'

const RestoreWalletBackupAndroid = () => {
  const { isCloudAvailable, backupHandler, downloadBackup, selectAccount, selectedGoogleAccount } =
    useGoogleDrive()
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
