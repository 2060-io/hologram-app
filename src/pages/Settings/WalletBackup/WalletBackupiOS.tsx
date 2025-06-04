import React from 'react'

import BaseWalletBackup from './BaseWalletBackup'
import { WalletBackupPageProps } from './WalletBackupProps'

import { useICloud } from '@2060/hooks'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const WalletBackupiOS = (props: WalletBackupPageProps) => {
  const { isCloudAvailable, backupInfoHandler, uploadFileToIcloud } = useICloud()

  return (
    <BaseWalletBackup
      isCloudAvailable={isCloudAvailable}
      makeBackup={uploadFileToIcloud}
      backupInfoHandler={backupInfoHandler}
    />
  )
}

export default WalletBackupiOS
