import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { BackupHandler } from '@2060/hooks/backup'

export interface WalletBackupPageProps extends StackScreenProps<NavigationStackParams, 'WalletBackup'> {}

export interface WalletBackupProps {
  isCloudAvailable: boolean
  makeBackup: (fileToUploadLocation: string) => Promise<void>
  backupHandler?: BackupHandler
  selectAccount?: () => void
  selectedGoogleAccount?: string
}

export type WalletBackupInfoProps = {
  backupHandler: BackupHandler | undefined
  withSuggestionMessage?: boolean
  selectAccount?: () => void
  selectedGoogleAccount?: string
}

export type WalletBackupHandlerProps = {
  containerStyle: StyleProp<ViewStyle>
  backupHandler: BackupHandler | undefined
  onLoading: () => React.ReactNode
  onInfo: () => React.ReactNode
  onNotExist: () => React.ReactNode
  onError: () => React.ReactNode
}
