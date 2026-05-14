import React from 'react'
import { Platform } from 'react-native'

import WalletBackupAndroid from './WalletBackupAndroid'
import WalletBackupiOS from './WalletBackupiOS'
import { WalletBackupPageProps } from './WalletBackupProps'

const WalletBackup = (props: WalletBackupPageProps) => {
  const WalletComponent = Platform.select({
    ios: () => <WalletBackupiOS {...props} />,
    android: () => <WalletBackupAndroid {...props} />,
  })
  return WalletComponent ? <WalletComponent /> : null
}

export default WalletBackup
