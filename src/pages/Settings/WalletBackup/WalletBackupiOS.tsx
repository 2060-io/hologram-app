import { useICloud } from '@src/hooks'
import { BackupProgressProps } from '@src/hooks/backup'
import React, { useState } from 'react'
import BaseWalletBackup, { backupProgressInitialValues } from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

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
