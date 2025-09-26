import { useTranslation } from 'react-i18next'
import { openPicker, Options, Image, Video, CommonOptions } from 'react-native-image-crop-picker'

import { MAX_VIDEO_DURATION } from '@2060/constants'
import { logError } from '@2060/utils'
import { toast } from '@2060/utils/toast'

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

export type ImageOrVideo = Image & Video

export const useImageCropPicker = () => {
  const { t } = useTranslation()

  const getPhotoOrVideoFromGallery = async (
    mediaType: keyof typeof optionsDefault,
    onSuccess: (values: ImageOrVideo) => void,
  ) => {
    try {
      const fileInfo = (await openPicker({ ...optionsDefault[mediaType] })) as ImageOrVideo
      const { mime, duration } = fileInfo
      const isVideoAndExceedsDuration = mime.startsWith('video') && duration && duration > MAX_VIDEO_DURATION
      if (isVideoAndExceedsDuration) {
        toast({ message: t('personalChat.videoExceedsDuration'), type: 'error' })
        return
      }
      onSuccess(fileInfo)
    } catch (error) {
      logError(`${error}`)
    }
  }

  return {
    getPhotoOrVideoFromGallery,
  }
}
