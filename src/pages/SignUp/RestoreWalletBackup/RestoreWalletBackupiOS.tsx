import React, { useState } from 'react'

import BaseRestoreWalletBackup from './BaseRestoreWalletBackup'
import { RestoreProgressProps } from './RestoreWalletBackupProps'

import { useICloud } from '@src/hooks'
import { restoreProgressInitialValues } from '@src/hooks/backup'

const RestoreWalletBackupiOS = () => {
  const { isCloudAvailable, backupHandler, downloadBackup } = useICloud()
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgressProps>(restoreProgressInitialValues)

  return (
    <BaseRestoreWalletBackup
      isCloudAvailable={isCloudAvailable}
      backupHandler={backupHandler}
      downloadBackup={downloadBackup(setRestoreProgress)}
      restoreProgress={restoreProgress}
      setRestoreProgress={setRestoreProgress}
    />
  )
}

export default RestoreWalletBackupiOS
