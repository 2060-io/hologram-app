import { MAX_VIDEO_DURATION } from '@src/constants'
import { logError } from '@src/utils'
import { handleCameraPermission } from '@src/utils/permissions'
import { toast } from '@src/utils/toast'
import { useTranslation } from 'react-i18next'
import { CommonOptions, Image, Options, openCamera, openPicker, Video } from 'react-native-image-crop-picker'
import { createDidCommPreview } from './media/preview'

const MAX_VIDEO_SECONDS_DURATION = 60
const optionsCommon: CommonOptions = {
  loadingLabelText: 'Applying changes...',
  useFrontCamera: true,
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

  const takePhotoOrVideo = async (onSuccess: (values: ImageOrVideo) => void, options?: Options) => {
    const mediaType = options?.mediaType || 'photo'
    try {
      const cameraPermission = await handleCameraPermission()
      if (!cameraPermission) return
      const fileInfo = (await openCamera({ ...optionsDefault[mediaType], ...options })) as ImageOrVideo
      const infoMedia = await createPreview(fileInfo, mediaType)
      onSuccess(infoMedia)
    } catch (error) {
      logError(`${error}`)
    }
  }

  const takePhotoOrVideoFromGallery = async (onSuccess: (values: ImageOrVideo) => void, options?: Options) => {
    const mediaType = options?.mediaType || 'photo'
    try {
      const fileInfo = (await openPicker({ ...optionsDefault[mediaType], ...options })) as ImageOrVideo
      const { mime, duration } = fileInfo
      const isVideoAndExceedsDuration = mime.startsWith('video') && duration && duration > MAX_VIDEO_DURATION
      if (isVideoAndExceedsDuration) {
        toast({ message: t('chat.videoExceedsDuration'), type: 'error', position: 'center' })
        return
      }
      const infoMedia = await createPreview(fileInfo, mediaType)
      onSuccess(infoMedia)
    } catch (error) {
      logError(`${error}`)
    }
  }

  return {
    takePhotoOrVideo,
    takePhotoOrVideoFromGallery,
  }
}
