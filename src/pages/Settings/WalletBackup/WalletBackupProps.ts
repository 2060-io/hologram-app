import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'

import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { OnBackupFinish, BackupHandler, BackupProgressProps, BackupInfo } from '@src/hooks/backup'

export interface WalletBackupPageProps extends StackScreenProps<NavigationStackParams, 'WalletBackup'> {}

export interface WalletBackupProps {
  isCloudAvailable: boolean
  makeBackup: (
    fileToUploadLocation: string,
    onBackupUploadSuccess: OnBackupFinish,
    onBackupUploadFailure: (error: string) => void,
  ) => Promise<void>
  backupHandler?: BackupHandler
  uploadProgress: BackupProgressProps
  setUploadProgress: React.Dispatch<React.SetStateAction<BackupProgressProps>>
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
  onInfo: (backupInfo: BackupInfo) => React.ReactNode
  onNotExist: () => React.ReactNode
  onError: () => React.ReactNode
}
