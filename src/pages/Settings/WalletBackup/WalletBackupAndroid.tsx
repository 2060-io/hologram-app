import React, { useState } from 'react'

import BaseWalletBackup, { backupProgressInitialValues } from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

import { useGoogleDrive } from '@src/hooks'
import { BackupProgressProps } from '@src/hooks/backup'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletBackupAndroid = (props: WalletBackupPageProps) => {
  const [uploadProgress, setUploadProgress] = useState<BackupProgressProps>(backupProgressInitialValues)
  const { isCloudAvailable, backupHandler, uploadFileToGoogleDrive, selectAccount, selectedGoogleAccount } =
    useGoogleDrive()

  return (
    <BaseWalletBackup
      isCloudAvailable={isCloudAvailable}
      makeBackup={uploadFileToGoogleDrive(setUploadProgress)}
      backupHandler={backupHandler}
      uploadProgress={uploadProgress}
      setUploadProgress={setUploadProgress}
      selectAccount={selectAccount}
      selectedGoogleAccount={selectedGoogleAccount}
    />
  )
}

export default WalletBackupAndroid
