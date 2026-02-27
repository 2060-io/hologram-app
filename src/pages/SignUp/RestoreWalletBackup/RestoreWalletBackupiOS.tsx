import React, { useState } from 'react'

import BaseRestoreWalletBackup from './BaseRestoreWalletBackup'
import { RestoreProgressProps } from './RestoreWalletBackupProps'

import { useICloud } from '@src/hooks'
import { restoreProgressInitialValues } from '@src/hooks/backup'

const RestoreWalletBackupiOS = () => {
  const { isCloudAvailable, backupInfoHandler, downloadBackup } = useICloud()
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgressProps>(restoreProgressInitialValues)

  return (
    <BaseRestoreWalletBackup
      isCloudAvailable={isCloudAvailable}
      backupInfoHandler={backupInfoHandler}
      downloadBackup={downloadBackup(setRestoreProgress)}
      restoreProgress={restoreProgress}
      setRestoreProgress={setRestoreProgress}
    />
  )
}

export default RestoreWalletBackupiOS
