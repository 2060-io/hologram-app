import { BackupHandler, RestoreProgress } from '@2060/hooks/backup'

export interface RestoreProgressProps extends RestoreProgress {}

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
}
