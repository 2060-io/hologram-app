export interface BackupInfoHandler {
  isFetching: boolean
  error?: boolean
  backup?: BackupInfo
}

interface BackupInfo {
  name?: string
  size?: string
  modifyDate?: string | number
  downloadUrl?: string
}

export interface BackupState {
  progress: number
  isUploadingBackup: boolean
  error: string
}

export interface RestoreProgress {
  progress: number
  isDownloadingBackUp: boolean
  error: string
  done: boolean
}

export type OnBackupFinish = (error?: string) => void

export const restoreProgressInitialValues = {
  progress: 0,
  isDownloadingBackUp: false,
  error: '',
  done: false,
}
