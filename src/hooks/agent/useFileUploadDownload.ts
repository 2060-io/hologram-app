import { createContext, useContext } from 'react'

export enum DownloadOptions {
  Never = 'never',
  Wifi = 'wifi',
  WifiAndMobileData = 'wifiAndMobileData',
}

export type AutomaticDownloadTypes = {
  audio: DownloadOptions
  images: DownloadOptions
  videos: DownloadOptions
}

export interface DidCommMediaFileSharingData {
  path: string
  mime: string
  size: number
  preview?: string
  width?: number
  height?: number
  duration?: number | null
  description?: string
}

interface FileUploadDownloadInterface {
  startMediaUpload: (options: {
    didcommConnectionIds: string[]
    didcommThreadId?: string
    didcommMediaFileSharingData: DidCommMediaFileSharingData
    deleteOriginalFile?: boolean
  }) => Promise<string>
  retryMediaUpload: (mediaRecordId: string) => Promise<void>
  downloadMediaFile: (mediaRecordId: string) => Promise<void>
  automaticDownloadValues: AutomaticDownloadTypes
  changeAutomaticDownloadOption: (
    key: keyof AutomaticDownloadTypes,
    value: string,
    callback: () => void,
  ) => void
}

export const FileUploadDownloadContext = createContext<FileUploadDownloadInterface | undefined>(undefined)

export const useFileUploadDownload = (): FileUploadDownloadInterface => {
  const context = useContext(FileUploadDownloadContext)
  if (!context) throw new Error('useFileUploadDownload must be used within a FileUploadDownloadProvider')

  return context
}
