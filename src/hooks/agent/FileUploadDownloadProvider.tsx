import { SharedMediaItem } from '@2060.io/credo-ts-didcomm-media-sharing'
import { utils } from '@credo-ts/core'
import { useAudioPlayer } from '@simform_solutions/react-native-audio-waveform'
import React, { useEffect, useCallback, useRef, useState } from 'react'
import { copyFile, downloadFile } from 'react-native-fs'

import { generateFileName } from '../media/files'
import { createLocalPreview } from '../media/preview'
import { useLocalRealm } from '../providers/RealmProvider'

import { useAgentActionQueue } from './AgentActionQueueProvider'
import { useMobileAgent } from './MobileAgentProvider'
import { AgentActionType } from './actions/AgentAction'
import { ShareMediaParameters } from './actions/types'
import {
  AutomaticDownloadTypes,
  DownloadOptions,
  DidCommMediaFileSharingData,
  FileUploadDownloadContext,
} from './useFileUploadDownload'

import { MediaDownloadState, MediaUploadState, UploadTask } from '@src/model'
import { s3UploadFile } from '@src/services/fileUploadService'
import {
  AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY,
  getStorageData,
  setStorageData,
} from '@src/services/localStorage'
import { log, logError } from '@src/utils'
import { deleteFile, getFileExtension, getLocalMediaFilePath, moveFile } from '@src/utils/RNFS'
import { decryptFile, encryptFile } from '@src/utils/ciphering'

const AUDIO_WAVEFORM_NUMBER_OF_CANDLES = 30
const { Pending, Uploading, Done, ErrorUploading } = MediaUploadState

const matchAutomaticDownloadTypes = (value: AutomaticDownloadTypes): value is AutomaticDownloadTypes =>
  Object.values(DownloadOptions).includes(value.audio) &&
  Object.values(DownloadOptions).includes(value.images) &&
  Object.values(DownloadOptions).includes(value.videos)

const defaultAutomaticDownloadValues: AutomaticDownloadTypes = {
  audio: DownloadOptions.WifiAndMobileData,
  images: DownloadOptions.WifiAndMobileData,
  videos: DownloadOptions.WifiAndMobileData,
}

interface Props {
  children?: React.ReactNode
}

export const FileUploadDownloadProvider: React.FC<Props> = ({ children }) => {
  const { agent } = useMobileAgent()
  const { extractWaveformData } = useAudioPlayer()
  const [automaticDownloadValues, setAutomaticDownloadValues] = useState<AutomaticDownloadTypes>(
    defaultAutomaticDownloadValues,
  )

  const { realm } = useLocalRealm()

  // TODO: Make persistent using realm
  const uploadTasks = useRef<UploadTask[]>([])
  const { addAgentActionToQueue } = useAgentActionQueue()

  useEffect(() => {
    const setupAutomaticDownloadValues = async () => {
      const persistedAutomaticDownloadValues = (await getStorageData(
        AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY,
      )) as AutomaticDownloadTypes
      if (persistedAutomaticDownloadValues && matchAutomaticDownloadTypes(persistedAutomaticDownloadValues)) {
        setAutomaticDownloadValues(persistedAutomaticDownloadValues)
      } else {
        await setStorageData(AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY, defaultAutomaticDownloadValues)
      }
    }
    setupAutomaticDownloadValues()
  }, [])

  useEffect(() => {
    if (!realm) return
    // Load existing upload tasks
    const realmUploadTasks = realm.objects(UploadTask)
    uploadTasks.current = Array.from(realmUploadTasks)

    const onUploadTaskChange: Realm.CollectionChangeCallback<UploadTask> = newUploadTasks => {
      uploadTasks.current = Array.from(newUploadTasks)
    }
    realmUploadTasks.addListener(onUploadTaskChange)

    return () => {
      realmUploadTasks.removeListener(onUploadTaskChange)
    }
  }, [realm])

  const changeAutomaticDownloadOption = useCallback(
    async (key: keyof AutomaticDownloadTypes, value: string, callback: () => void) => {
      callback()
      const newAutomaticDownloadValues = { ...automaticDownloadValues, [key]: value }
      setAutomaticDownloadValues(newAutomaticDownloadValues)
      await setStorageData(AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY, newAutomaticDownloadValues)
    },
    [automaticDownloadValues],
  )

  const getAudioWaveform = useCallback(async (filePath: string) => {
    const waveformData = await extractWaveformData({
      path: filePath,
      playerKey: `PlayerFor${filePath}`,
      noOfSamples: AUDIO_WAVEFORM_NUMBER_OF_CANDLES,
    })
    if (waveformData.length) {
      const [waveform] = waveformData
      if (waveform.length) return JSON.stringify(waveform)
    }
  }, [])

  const downloadMediaFile = useCallback(
    async (mediaRecordId: string) => {
      if (!agent) return

      const mediaRecord = await agent.modules.media.findById(mediaRecordId)
      if (!mediaRecord) throw new Error(`No shared media record with id ${mediaRecordId}`)

      if (!mediaRecord.items || !mediaRecord.items[0]) {
        throw new Error(`No shared media item found in media record with id ${mediaRecordId}`)
      }

      if (!mediaRecord.items) {
        throw new Error(`No shared items present in media sharing record ${mediaRecord.id}`)
      }

      // We assume a single item per media record
      const item = mediaRecord.items[0]

      const { ciphering, uri, mimeType } = item

      const fileExtension = item.fileName ? getFileExtension(item.fileName) : undefined
      const filename = generateFileName(mimeType, fileExtension)

      const localFilePath = getLocalMediaFilePath(filename)
      const downloadLocalFilePath = ciphering ? `${localFilePath}.encrypted` : localFilePath
      try {
        await agent.modules.media.setMetadata(
          mediaRecord.id,
          'mediaDownloadState',
          MediaDownloadState.Downloading,
        )
        const { promise } = downloadFile({
          fromUrl: uri,
          toFile: downloadLocalFilePath,
          progressInterval: 2000,
          begin: () => log('Download of file begin'),
          progress: progress => {
            if (item.byteCount) {
              const currentProgress = Math.ceil((progress.bytesWritten / item.byteCount) * 100)
              agent.modules.media.setMetadata(mediaRecord.id, 'mediaDownloadProgress', currentProgress)
              log(`Download media from ${uri} progress: ${currentProgress}%`)
            }
          },
        })
        const result = await promise
        if (result.statusCode !== 200) {
          throw new Error(`code ${result.statusCode} / url ${uri}`)
        }

        if (ciphering) {
          await decryptFile({
            originFilePath: downloadLocalFilePath,
            destinationFilePath: localFilePath,
            cipheringInfo: ciphering,
          })

          // Now we are safe to delete encrypted file
          await deleteFile(downloadLocalFilePath)
        }
        if (mimeType.startsWith('audio')) {
          const waveform = await getAudioWaveform(localFilePath)
          if (waveform) {
            await agent.modules.media.setMetadata(mediaRecord.id, 'waveform', waveform)
          }
        } else {
          // In case of images and videos, create a local preview for it to show in conversations
          const localPreviewFilePath = await createLocalPreview({ mimeType, localFilePath })
          // Paths to media and preview are stored relative to app's documents directory
          if (localPreviewFilePath) {
            await agent.modules.media.setMetadata(
              mediaRecord.id,
              'localPreviewFilePath',
              localPreviewFilePath,
            )
          }
        }

        await agent.modules.media.setMetadata(mediaRecord.id, 'localFilePath', `media/${filename}`)
        await agent.modules.media.setMetadata(mediaRecord.id, 'mediaDownloadState', MediaDownloadState.Done)
      } catch (error) {
        await agent.modules.media.setMetadata(mediaRecord.id, 'mediaDownloadState', MediaDownloadState.Failed)
        logError(`Error downloading file: ${error}`)
        throw error
      } finally {
        await agent.modules.media.setMetadata(mediaRecord.id, 'mediaDownloadProgress', undefined)
      }
    },
    [agent],
  )

  const startMediaUpload = useCallback(
    async (options: {
      didcommConnectionIds: string[]
      didcommThreadId?: string
      didcommMediaFileSharingData: DidCommMediaFileSharingData
      deleteOriginalFile?: boolean
    }) => {
      if (!realm) return
      const { didcommConnectionIds, didcommMediaFileSharingData, didcommThreadId, deleteOriginalFile } =
        options
      const {
        fileName: originalFileName,
        mime: mimeType,
        path,
        size,
        description,
        width,
        height,
        preview,
        duration,
      } = didcommMediaFileSharingData
      if (!agent) return

      // 1. Assign unique id to the file upload and
      const fileId = utils.uuid()
      const fileExtension = originalFileName ? getFileExtension(originalFileName) : undefined

      const fileName = generateFileName(mimeType, fileExtension)
      const localFilePath = getLocalMediaFilePath(fileName)

      if (deleteOriginalFile) await moveFile(path, localFilePath)
      else await copyFile(path, localFilePath)

      const uploadFilePath = localFilePath + '.encrypted'

      const cipheringInfo = await encryptFile({
        originFilePath: localFilePath,
        destinationFilePath: uploadFilePath,
      })

      // In case of images and videos, create a local preview for it to show in conversations
      const localPreviewFilePath = await createLocalPreview({ mimeType, localFilePath })
      let waveform: string | undefined
      const isAudioFile = mimeType.startsWith('audio')
      if (isAudioFile) {
        waveform = await getAudioWaveform(localFilePath)
      }
      const mediaRecordIds: string[] = []
      for (const connectionId of didcommConnectionIds) {
        const mediaRecord = await agent?.modules.media.create({
          connectionId,
          description,
          parentThreadId: didcommThreadId,
          items: [
            new SharedMediaItem({
              id: fileId,
              uri: `https://s3.minio.dev.2060.io/public/${fileId}`,
              mimeType,
              fileName,
              byteCount: size,
              metadata: {
                preview,
                duration,
                width,
                height,
              },
              ciphering: cipheringInfo,
            }),
          ], // TODO: FIX THIS!
          // Store relative path for files and previews to avoid issues with new builds in iOS
          metadata: {
            localFilePath: `media/${fileName}`,
            localPreviewFilePath: localPreviewFilePath ?? undefined,
            ...(isAudioFile && { waveform }),
          },
        })
        mediaRecordIds.push(mediaRecord.id)
      }

      const newTask = realm.write(() => {
        const createdTask = realm!.create(UploadTask, {
          fileId,
          mediaRecordIds,
          state: Pending,
          uploadFilePath,
        })
        return createdTask
      })

      s3UploadFile({
        key: fileId,
        filePath: uploadFilePath,
        onMultipartCreated: async () => {
          await setMediaUploadState(newTask, Uploading)
        },
        onProgress: async progress => {
          log(`Uploading file with key ${fileId} progress: ${progress}%`)
          for (const mediaRecordId of newTask.mediaRecordIds) {
            const relatedRecord = await agent.modules.media.findById(mediaRecordId)
            if (!relatedRecord) continue
            await agent.modules.media.setMetadata(mediaRecordId, 'mediaUploadProgress', progress)
          }
        },
        onError: async error => {
          logError(`Error uploading file with key ${fileId}: ${error}`)
          await setMediaUploadState(newTask, ErrorUploading)
        },
        onUploadComplete: async result => {
          log(`Upload complete for file with key ${fileId}`, result)
          deleteFile(uploadFilePath)
          for (const mediaRecordId of newTask.mediaRecordIds) {
            const relatedRecord = await agent.modules.media.findById(mediaRecordId)
            if (!relatedRecord) continue
            await agent.modules.media.setMetadata(mediaRecordId, 'mediaUploadState', Done)
            const parameters: ShareMediaParameters = { recordId: relatedRecord.id }
            addAgentActionToQueue({
              type: AgentActionType.ShareMedia,
              parameters,
            })
          }
          realm?.write(() => {
            realm.delete(newTask)
          })
        },
      })
    },
    [agent, realm],
  )

  const retryMediaUpload = useCallback(
    async (mediaRecordId: string) => {
      if (!agent) return
      const mediaRecord = await agent.modules.media.findById(mediaRecordId)
      if (mediaRecord) {
        const fileId = mediaRecord.items![0].id
        // Find the corresponding task
        const task = uploadTasks.current.find(item => item.fileId === fileId)
        if (!task) throw new Error(`Cannot find ongoing upload with id ${fileId}`)
        s3UploadFile({
          key: task.fileId,
          filePath: task.uploadFilePath,
          onMultipartCreated: async () => {
            await setMediaUploadState(task, Uploading)
          },
          onProgress: async progress => {
            log(`Retrying upload file with key ${task.fileId} progress: ${progress}%`)
            for (const taskMediaRecordId of task.mediaRecordIds) {
              const relatedRecord = await agent.modules.media.findById(taskMediaRecordId)
              if (!relatedRecord) continue
              await agent.modules.media.setMetadata(taskMediaRecordId, 'mediaUploadProgress', progress)
            }
          },
          onError: async error => {
            logError(`Error retrying upload file with key ${task.fileId}: ${error}`)
            await setMediaUploadState(task, ErrorUploading)
          },
          onUploadComplete: async result => {
            log(`Retry upload file with key ${task.fileId} complete`, result)
            deleteFile(task.uploadFilePath)
            for (const taskMediaRecordId of task.mediaRecordIds) {
              const relatedRecord = await agent.modules.media.findById(taskMediaRecordId)
              if (!relatedRecord) continue
              await agent.modules.media.setMetadata(taskMediaRecordId, 'mediaUploadState', Done)
              const parameters: ShareMediaParameters = { recordId: relatedRecord.id }
              addAgentActionToQueue({
                type: AgentActionType.ShareMedia,
                parameters,
              })
            }
            realm?.write(() => {
              realm.delete(task)
            })
          },
        })
      } else throw new Error(`media record not found with id: ${mediaRecordId}`)
    },
    [agent, realm],
  )

  const setMediaUploadState = useCallback(
    async (task: UploadTask, mediaUploadState: MediaUploadState) => {
      if (!agent) return
      realm?.write(() => {
        task.state = mediaUploadState
      })
      for (const mediaRecordId of task.mediaRecordIds) {
        await agent.modules.media.setMetadata(mediaRecordId, 'mediaUploadState', mediaUploadState)
      }
    },
    [agent, realm],
  )

  return (
    <FileUploadDownloadContext
      value={{
        startMediaUpload,
        retryMediaUpload,
        downloadMediaFile,
        automaticDownloadValues,
        changeAutomaticDownloadOption,
      }}
    >
      {children}
    </FileUploadDownloadContext>
  )
}
