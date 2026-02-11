import { NetInfoStateType } from '@react-native-community/netinfo'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { AutomaticDownloadTypes, DownloadOptions, useFileUploadDownload } from './agent'
import { useNetwork } from './useNetwork'

import { ChatEntryRole, MediaDownloadState } from '@src/model'
import { logError } from '@src/utils'
import { existsFile, getFullLocalFilePath } from '@src/utils/RNFS'

const { Pending, Downloading, Failed } = MediaDownloadState
const { Never, Wifi, WifiAndMobileData } = DownloadOptions

export const useMedia = ({
  mediaRecordId,
  localFilePath,
  type,
  mediaDownloadState,
  role,
}: {
  mediaRecordId: string
  localFilePath?: string
  type: keyof AutomaticDownloadTypes
  mediaDownloadState?: MediaDownloadState
  role: ChatEntryRole
}) => {
  const { netInfo } = useNetwork()
  const { retryMediaUpload, downloadMediaFile, automaticDownloadValues } = useFileUploadDownload()
  const initialMediaDownloadState = useRef<MediaDownloadState>(undefined)
  const [isDownloaded, setIsDownloaded] = useState(localFilePath !== null)
  const [isDownloading, setIsDownloading] = useState(mediaDownloadState === Downloading)
  const [isRetryingUpload, startRetryUploadTransition] = useTransition()
  const mediaDownloadOption = automaticDownloadValues[type]

  useEffect(() => {
    initialMediaDownloadState.current = mediaDownloadState
  }, [])

  useEffect(() => {
    if (localFilePath) existsFile(getFullLocalFilePath(localFilePath)).then(setIsDownloaded)
  }, [localFilePath])

  useEffect(() => {
    const isSender = role === ChatEntryRole.Sender
    const isDownloadingAsInitState = initialMediaDownloadState.current === Downloading
    const isInternetConnected = netInfo.isConnected
    const needsToBeDownloaded = (mediaDownloadState === Pending || isDownloadingAsInitState) && !isDownloaded
    if (
      isSender ||
      !needsToBeDownloaded ||
      mediaDownloadState === Failed ||
      mediaDownloadOption === Never ||
      !isInternetConnected
    ) {
      return
    }
    const isWifiConnected = netInfo.type === NetInfoStateType.wifi
    const isCellularConnected = netInfo.type === NetInfoStateType.cellular
    const canDownloadByWifiAndMobileData =
      (isWifiConnected || isCellularConnected) && mediaDownloadOption === WifiAndMobileData
    const canDownloadByWifi = isWifiConnected && mediaDownloadOption === Wifi
    const makeAutomaticDownload = canDownloadByWifiAndMobileData || canDownloadByWifi
    if (makeAutomaticDownload) downloadMedia()
  }, [mediaDownloadOption, mediaDownloadState, netInfo, isDownloaded])

  const downloadMedia = useCallback(async () => {
    setIsDownloading(true)
    try {
      await downloadMediaFile(mediaRecordId)
    } catch (error) {
      logError(`Error downloading media: ${error}`)
    } finally {
      setIsDownloading(false)
    }
  }, [mediaRecordId])

  const handleRetryMediaUpload = useCallback(async () => {
    startRetryUploadTransition(async () => {
      try {
        await retryMediaUpload(mediaRecordId)
      } catch (error) {
        logError(`Error retrying media upload:${error}`)
      }
    })
  }, [mediaRecordId])

  return {
    isDownloaded,
    isDownloading,
    downloadMedia,
    retryMediaUpload: handleRetryMediaUpload,
    isRetryingUpload,
  }
}
