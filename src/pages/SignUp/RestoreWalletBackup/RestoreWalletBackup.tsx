import React from 'react'
import { Platform } from 'react-native'

import RestoreWalletBackupAndroid from './RestoreWalletBackupAndroid'
import RestoreWalletBackupiOS from './RestoreWalletBackupiOS'

const RestoreWalletBackup = () => {
  const RestoreWalletBackupComponent = Platform.select({
    ios: () => <RestoreWalletBackupiOS />,
    android: () => <RestoreWalletBackupAndroid />,
  })
  return RestoreWalletBackupComponent ? <RestoreWalletBackupComponent /> : null
}

export default RestoreWalletBackup
