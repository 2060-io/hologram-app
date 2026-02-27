import React from 'react'

import BaseWalletBackup from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

import { useICloud } from '@src/hooks'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletBackupiOS = (props: WalletBackupPageProps) => {
  const { isCloudAvailable, backupInfoHandler, uploadFileToIcloud } = useICloud()

  return (
    <BaseWalletBackup
      isCloudAvailable={isCloudAvailable}
      uploadBackupToCloud={uploadFileToIcloud}
      backupInfoHandler={backupInfoHandler}
    />
  )
}

export default WalletBackupiOS
