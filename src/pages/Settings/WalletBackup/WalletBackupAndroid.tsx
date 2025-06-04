import React from 'react'

import BaseWalletBackup from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

import { useGoogleDrive } from '@2060/hooks'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletBackupAndroid = (props: WalletBackupPageProps) => {
  const { isCloudAvailable, backupHandler, uploadFileToGoogleDrive, selectAccount, selectedGoogleAccount } =
    useGoogleDrive()

  return (
    <BaseWalletBackup
      isCloudAvailable={isCloudAvailable}
      makeBackup={uploadFileToGoogleDrive}
      backupHandler={backupHandler}
      selectAccount={selectAccount}
      selectedGoogleAccount={selectedGoogleAccount}
    />
  )
}

export default WalletBackupAndroid
