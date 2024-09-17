import React, { useState } from 'react'

import BaseWalletBackup, { backupProgressInitialValues } from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

import { useICloud } from '@2060/hooks'
import { BackupProgressProps } from '@2060/hooks/backup'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletBackupiOS = (props: WalletBackupPageProps) => {
  const [uploadProgress, setUploadProgress] = useState<BackupProgressProps>(backupProgressInitialValues)
  const { isCloudAvailable, backupHandler, uploadFileToIcloud } = useICloud()

  return (
    <BaseWalletBackup
      isCloudAvailable={isCloudAvailable}
      makeBackup={uploadFileToIcloud(setUploadProgress)}
      backupHandler={backupHandler}
      uploadProgress={uploadProgress}
      setUploadProgress={setUploadProgress}
    />
  )
}

export default WalletBackupiOS
