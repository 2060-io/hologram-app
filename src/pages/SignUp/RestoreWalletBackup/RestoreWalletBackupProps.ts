import { StyleProp, ViewStyle } from 'react-native'

import { BackupHandler, RestoreProgress } from '@src/hooks/backup'

export type RestoreProgressProps = RestoreProgress

export type BaseRestoreWalletBackupProps = {
  isCloudAvailable: boolean
  backupHandler: BackupHandler | undefined
  downloadBackup: () => Promise<boolean | unknown>
  restoreProgress: RestoreProgressProps
  setRestoreProgress: React.Dispatch<React.SetStateAction<RestoreProgressProps>>
  selectAccount?: () => void
  selectedGoogleAccount?: string
}

export type RestoreProps = {
  restoreProgress: RestoreProgressProps
  onInitialState: () => React.ReactNode
  onDownloading: () => React.ReactNode
  onError: () => React.ReactNode
  onSuccessFinish: () => React.ReactNode
  style: StyleProp<ViewStyle>
}
