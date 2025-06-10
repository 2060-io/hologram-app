import { useTranslation } from 'react-i18next'
import { Video as VideoCompressor } from 'react-native-compressor'
import { stat } from 'react-native-fs'
import { openPicker, openCamera, Options, Image, Video, CommonOptions } from 'react-native-image-crop-picker'

import { createDidCommPreview } from './media/preview'

import { IS_ANDROID, MAX_VIDEO_DURATION } from '@2060/constants'
import { log, logError } from '@2060/utils'
import { deleteFile } from '@2060/utils/RNFS'
import { toast } from '@2060/utils/toast'

const MAX_VIDEO_SECONDS_DURATION = 60
const optionsCommon: CommonOptions = {
  loadingLabelText: 'Applying changes...',
  useFrontCamera: true,
  sortOrder: 'desc',
}

const defaultCamera: Options = {
  mediaType: 'photo',
  width: 300,
  height: 300,
  cropping: false,
  compressImageMaxWidth: 1280,
  includeBase64: true,
  compressImageQuality: 0.8,
  cropperChooseText: 'Save',
  cropperCancelText: 'Cancel',
  forceJpg: true,
  ...optionsCommon,
}

const defaultVideo: Options = {
  mediaType: 'video',
  compressVideoPreset: 'MediumQuality',
  maximumVideoDuration: MAX_VIDEO_SECONDS_DURATION,
  ...optionsCommon,
}

const optionsDefault = {
  video: defaultVideo,
  photo: defaultCamera,
  any: { ...defaultCamera, ...defaultVideo },
}

export interface ImageOrVideo extends Image, Video {
  preview?: string
}

export const useImageCropPicker = () => {
  const { t } = useTranslation()
  const createPreview = async (fileInfo: ImageOrVideo, mediaType: string) => {
    if (['photo', 'any'].includes(mediaType) && fileInfo.data) {
      const previewResult = await createDidCommPreview({
        localFilePath: fileInfo.path,
        mimeType: fileInfo.mime,
      })
      fileInfo.preview = previewResult
    }
    if (['video'].includes(mediaType) || fileInfo.mime === 'video/mp4') {
      const previewResult = await createDidCommPreview({
        localFilePath: fileInfo.path,
        mimeType: fileInfo.mime,
      })
      fileInfo.preview = previewResult
    }
    return fileInfo
  }

  const tryToCompressVideo = async (fileInfo: ImageOrVideo): Promise<ImageOrVideo> => {
    try {
      const compressedVideoPath = await VideoCompressor.compress(fileInfo.path, {}, progress => {
        log('Compressing video progress: ', progress)
      })
      await deleteFile(fileInfo.path)
      fileInfo.path = compressedVideoPath
      const { size } = await stat(compressedVideoPath)
      fileInfo.size = size
    } catch (error) {
      logError(`Error compressing video: ${error}`)
    } finally {
      return fileInfo
    }
  }

  const takePhotoOrVideo = async (callBack: (values: ImageOrVideo) => void, options?: Options) => {
    const mediaType = options?.mediaType || 'photo'
    try {
      let fileInfo = (await openCamera({ ...optionsDefault[mediaType], ...options })) as ImageOrVideo
      if (IS_ANDROID && fileInfo.mime.startsWith('video')) {
        fileInfo = await tryToCompressVideo(fileInfo)
      }
      const infoMedia = await createPreview(fileInfo, mediaType)
      callBack(infoMedia)
    } catch (error) {
      logError(`${error}`)
    }
  }

  const takePhotoOrVideoFromGallery = async (callBack: (values: ImageOrVideo) => void, options?: Options) => {
    const mediaType = options?.mediaType || 'photo'
    try {
      let fileInfo = (await openPicker({ ...optionsDefault[mediaType], ...options })) as ImageOrVideo
      const { mime, duration } = fileInfo
      const isVideoAndExceedsDuration = mime.startsWith('video') && duration && duration > MAX_VIDEO_DURATION
      if (isVideoAndExceedsDuration) {
        toast({ message: t('personalChat.videoExceedsDuration'), type: 'error', position: 'center' })
        return
      }
      if (IS_ANDROID && fileInfo.mime.startsWith('video')) {
        fileInfo = await tryToCompressVideo(fileInfo)
      }
      const infoMedia = await createPreview(fileInfo, mediaType)
      callBack(infoMedia)
    } catch (error) {
      logError(`${error}`)
    }
  }

  return {
    takePhotoOrVideo,
    takePhotoOrVideoFromGallery,
  }
}
