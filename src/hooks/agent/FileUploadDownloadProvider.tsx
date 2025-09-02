/* eslint-disable import/no-named-as-default-member */
import { SharedMediaItem } from '@2060.io/credo-ts-didcomm-media-sharing'
import { utils } from '@credo-ts/core'
import { useAudioPlayer } from '@simform_solutions/react-native-audio-waveform'
import axios from 'axios'
import { t } from 'i18next'
import React, { useEffect, useCallback, useRef, useState } from 'react'
import Upload, { CompletedData, UploadOptions } from 'react-native-background-upload'
import { copyFile, downloadFile } from 'react-native-fs'
import { createChunks } from 'react-native-video-properties'

import { generateFileName } from '../media/files'
import { createLocalPreview } from '../media/preview'
import { useConfig } from '../providers/ConfigProvider'
import { useLocalRealm } from '../providers/RealmProvider'

import { useChats } from './ChatProvider'
import { useMobileAgent } from './MobileAgentProvider'
import { AgentActionType } from './actions/AgentAction'
import {
  AutomaticDownloadTypes,
  DownloadOptions,
  DidCommMediaFileSharingData,
  FileUploadDownloadContext,
} from './useFileUploadDownload'

import { IS_IOS } from '@2060/constants'
import { MediaDownloadState, MediaUploadState, UploadChunkTask, UploadTask } from '@2060/model'
import {
  AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY,
  getStorageData,
  setStorageData,
} from '@2060/services/localStorage'
import { log, logError, logWarn } from '@2060/utils'
import {
  deleteFile,
  getFileExtension,
  getLocalMediaFilePath,
  mediaDirectoryPath,
  moveFile,
} from '@2060/utils/RNFS'
import { decryptFile, encryptFile } from '@2060/utils/ciphering'
import { getAppCheckHeaders } from '@2060/utils/firebaseUtils'

const AUDIO_WAVEFORM_NUMBER_OF_CANDLES = 30
const { Pending, Uploading, Done, Canceled, ErrorCreating, ErrorUploading } = MediaUploadState

const matchAutomaticDownloadTypes = (value: AutomaticDownloadTypes): value is AutomaticDownloadTypes =>
  Object.values(DownloadOptions).includes(value.audio) &&
  Object.values(DownloadOptions).includes(value.images) &&
  Object.values(DownloadOptions).includes(value.videos)

const defaultAutomaticDownloadValues: AutomaticDownloadTypes = {
  audio: DownloadOptions.WifiAndMobileData,
  images: DownloadOptions.WifiAndMobileData,
  videos: DownloadOptions.WifiAndMobileData,
}

const CHUNK_SIZE = 2_000_000

interface Props {
  children?: React.ReactNode
}

/**
 * @description Method that allows the creation of a file by chunks
 * @param uuid unique file id
 * @param numberChunks Number of chunks in which the file is divided
 */
const fileCreate = async (dataStoreUrl: string, uuid: string, numberChunks: number) => {
  const headers = await getAppCheckHeaders()
  return await axios.create({ baseURL: dataStoreUrl }).post(`/c/${uuid}/${numberChunks}`, undefined, {
    headers,
  })
}

const uploadChunk = async (dataStoreUrl: string, filePath: string, fileId: string, chunkNumber: number) => {
  const headers = { ...(await getAppCheckHeaders()), 'content-type': 'multipart/form-data' }
  const options: UploadOptions = {
    customUploadId: `${fileId}/${chunkNumber}`,
    url: `${dataStoreUrl}/u/${fileId}/${chunkNumber}`,
    path: IS_IOS ? `file://${filePath}` : filePath,
    method: 'PUT',
    field: 'chunk',
    type: 'multipart',
    headers,
    notification: {
      autoClear: true,
      onProgressMessage: t('personalChat.uploadingMedia'),
      onProgressTitle: 'Hologram',
    },
  }
  log(`uploading chunk with options: ${JSON.stringify(options)}`)
  return await Upload.startUpload(options)
}

export const FileUploadDownloadProvider: React.FC<Props> = ({ children }) => {
  const { agent } = useMobileAgent()
  const { devEnvs } = useConfig()
  const { extractWaveformData } = useAudioPlayer()
  const [automaticDownloadValues, setAutomaticDownloadValues] = useState<AutomaticDownloadTypes>(
    defaultAutomaticDownloadValues,
  )
  const dataStoreUrl = devEnvs.DATA_STORE_URL

  const { realm } = useLocalRealm()

  // TODO: Make persistent using realm
  const uploadTasks = useRef<UploadTask[]>([])
  const { addAgentActionToQueue } = useChats()

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
      if (!realm) throw new Error('Realm undefined')
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
      if (!agent) {
        logError('Agent undefined')
        throw Error('Agent undefined')
      }

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

      const chunkFilePaths = await createChunks(uploadFilePath, `${mediaDirectoryPath}/${fileId}`, CHUNK_SIZE)
      log('cipheringInfo', cipheringInfo)

      // Now we are safe to delete encrypted file
      await deleteFile(uploadFilePath)

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
              uri: `${dataStoreUrl}/r/${fileId}`,
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

      // Create upload task
      const chunks: UploadChunkTask[] = []
      for (let i = 0; i < chunkFilePaths.length; i++) {
        chunks.push({
          id: `${fileId}/${i}`,
          filePath: chunkFilePaths[i],
          state: 'pending',
        })
      }

      const newTask = realm.write(() => {
        const createdTask = realm!.create(UploadTask, {
          fileId,
          mediaRecordIds,
          state: Pending,
        })
        createdTask.chunks = chunks
        return createdTask
      })

      try {
        await createDataStoreResourceForTask(newTask)
      } catch (error) {
        await setMediaUploadState(newTask, ErrorCreating)
        throw error
      }

      // File creation OK. Now start uploading chunks
      await setMediaUploadState(newTask, Uploading)
      const uploadId = await uploadChunk(dataStoreUrl, chunks[0].filePath, fileId, 0)
      log(`Upload started: uploadId: ${uploadId} mediaRecordIds: ${JSON.stringify(mediaRecordIds)}`)
      return uploadId
    },
    [agent, dataStoreUrl, realm],
  )

  const retryMediaUpload = useCallback(
    async (mediaRecordId: string) => {
      if (!agent) return
      try {
        const mediaRecord = await agent.modules.media.findById(mediaRecordId)
        if (mediaRecord) {
          const fileId = mediaRecord.items![0].id
          // Find the corresponding task
          const task = uploadTasks.current.find(item => item.fileId === fileId)

          if (!task) throw new Error(`Cannot find ongoing upload with id ${fileId}`)

          if ([Pending, ErrorCreating, ErrorUploading].includes(task.state)) {
            if (task.state !== ErrorUploading) await createDataStoreResourceForTask(task)
            await setMediaUploadState(task, Uploading)
          }

          if (task.state !== Uploading) {
            throw new Error(`Cannot retry media: wrong state: ${task.state}`)
          }
          // Find the next chunk looking at the current state of each
          const nextChunkIndex = task.chunks.findIndex(chunk => chunk.state === 'pending')
          if (nextChunkIndex !== -1) {
            const nextChunk = task.chunks[nextChunkIndex]
            const uploadId = await uploadChunk(dataStoreUrl, nextChunk.filePath, task.fileId, nextChunkIndex)
            log(`Resume upload started: uploadId: ${uploadId} fileId: ${task.fileId}`)
          }
        } else throw new Error(`media record not found with id: ${mediaRecordId}`)
      } catch (error) {
        logError(`Error retrying upload file: ${error}`)
      }
    },
    [agent, dataStoreUrl, realm],
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

  const createDataStoreResourceForTask = useCallback(
    async (task: UploadTask) => {
      // File creation
      try {
        await fileCreate(dataStoreUrl, task.fileId, task.chunks.length)
      } catch (error) {
        await setMediaUploadState(task, ErrorCreating)
        throw Error(`fileCreate error: ${error}`)
      }
    },
    [agent, dataStoreUrl],
  )
  useEffect(() => {
    if (!agent) return

    const onChunkUploadComplete = async (data: CompletedData) => {
      log(`Completed: uploadId: ${data.id}`)

      if (!agent) {
        logError('Agent undefined')
        return
      }
      const task = uploadTasks.current.find(item => item.chunks.find(chunk => chunk.id === data.id))

      if (!task) {
        logWarn(`Task not found for ${data.id}`)
        return
      }

      // Mark this chunk as finished
      const chunkIndex = task.chunks.findIndex(chunk => chunk.id === data.id)
      realm?.write(() => {
        const newChunksState = [...task.chunks]
        newChunksState[chunkIndex].state = 'finished'
        task.chunks = newChunksState
      })

      const isTaskFinished = task.chunks.every(chunk => chunk.state === 'finished')

      for (const mediaRecordId of task.mediaRecordIds) {
        const relatedRecord = await agent.modules.media.findById(mediaRecordId)

        // FIXME: Should we throw an error when no record is found?
        if (!relatedRecord) continue

        log(`Upload finished. Adding agent action to queue for record id: ${relatedRecord.id}`)
        await agent.modules.media.setMetadata(
          mediaRecordId,
          'mediaUploadProgress',
          (100 * (chunkIndex + 1)) / task.chunks.length,
        )

        if (isTaskFinished) {
          await agent.modules.media.setMetadata(mediaRecordId, 'mediaUploadState', Done)

          // TODO: ShareMedia should not receive recordId,
          // but all parameters needed to create/share through DIDComm
          addAgentActionToQueue({
            type: AgentActionType.ShareMedia,
            parameters: {
              recordId: relatedRecord.id,
            },
          })
        }
      }

      if (isTaskFinished) {
        // Delete all chunk files
        for (const chunk of task.chunks) {
          deleteFile(chunk.filePath)
        }

        realm?.write(() => {
          realm.delete(task)
        })
      } else {
        const nextChunkIndex = chunkIndex + 1
        if (nextChunkIndex >= task.chunks.length) {
          logError('Cannot get the next chunk')
          return
        }

        // Upload next chunk
        const nextChunk = task.chunks[nextChunkIndex]
        const uploadId = await uploadChunk(dataStoreUrl, nextChunk.filePath, task.fileId, nextChunkIndex)
        log(`Upload started: uploadId: ${uploadId} fileId: ${task.fileId}`)
      }
    }

    const uploadSubscription = Upload.addListener('progress', null, async data => {
      log(`Progress: ${data.progress}%`) // TODO
    })

    const errorSubscription = Upload.addListener('error', null, data => {
      log(`Upload job error: ${JSON.stringify(data)}`)
      const task = uploadTasks.current.find(item => item.chunks.find(chunk => chunk.id === data.id))
      if (task) {
        realm?.write(() => {
          task.state = ErrorUploading
        })
        for (const mediaRecordId of task.mediaRecordIds) {
          agent.modules.media.setMetadata(mediaRecordId, 'mediaUploadState', ErrorUploading)
        }
      }
    })
    const cancelSubscription = Upload.addListener('cancelled', null, data => {
      log(`Upload job cancelled: ${data.id}`)
      const task = uploadTasks.current.find(item => item.chunks.find(chunk => chunk.id === data.id))
      if (task) {
        realm?.write(() => {
          task.state = Canceled
        })
        for (const mediaRecordId of task.mediaRecordIds) {
          agent.modules.media.setMetadata(mediaRecordId, 'mediaUploadState', Canceled)
        }
      }
    })
    const completeSubscription = Upload.addListener('completed', null, onChunkUploadComplete)

    return () => {
      uploadSubscription.remove()
      errorSubscription.remove()
      cancelSubscription.remove()
      completeSubscription.remove()
    }
  }, [agent, dataStoreUrl, realm])

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
