import React from 'react'

import BaseWalletBackup from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

import { useGoogleDrive } from '@src/hooks'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletBackupAndroid = (props: WalletBackupPageProps) => {
  const {
    isCloudAvailable,
    backupInfoHandler,
    uploadFileToGoogleDrive,
    selectAccount,
    selectedGoogleAccount,
  } = useGoogleDrive()

  return (
    <BaseWalletBackup
      isCloudAvailable={isCloudAvailable}
      uploadBackupToCloud={uploadFileToGoogleDrive}
      backupInfoHandler={backupInfoHandler}
      selectAccount={selectAccount}
      selectedGoogleAccount={selectedGoogleAccount}
    />
  )
}

export default WalletBackupAndroid
