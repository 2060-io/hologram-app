import { openPicker, openCamera, Options, Image, Video, CommonOptions } from 'react-native-image-crop-picker'

import { createDidCommPreview } from './media/preview'

import { log } from '@2060/utils'

const optionsCommon: CommonOptions = {
  loadingLabelText: 'Applying changes...',
  useFrontCamera: true,
  sortOrder: 'desc',
}

const defaultCamera: Options = {
  mediaType: 'photo',
  width: 300,
  height: 300,
  cropping: true,
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
  ...optionsCommon,
}

const optionsDefault = {
  video: defaultVideo,
  photo: defaultCamera,
  any: { ...defaultCamera, ...defaultVideo },
}

export interface ImageOrVideo extends Image, Video {
  urlBase64?: string
  preview?: string
}

export const useImageCropPicker = () => {
  const uploadMedia = async (fileInfo: ImageOrVideo, mediaType: string) => {
    const existsData = fileInfo.data

    if (['photo', 'any'].includes(mediaType) && existsData) {
      fileInfo.urlBase64 = `data:${fileInfo.mime};base64,${fileInfo.data}`
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

  const takePhotoOrVideo = async (callBack: (values: ImageOrVideo) => void, options?: Options) => {
    const mediaType = options?.mediaType || 'photo'
    try {
      const fileInfo = (await openCamera({ ...optionsDefault[mediaType], ...options })) as ImageOrVideo
      const infoMedia = await uploadMedia(fileInfo, mediaType)
      callBack(infoMedia)
    } catch (error) {
      log(JSON.stringify(error))
    }
  }

  const takePhotoOrVideoFromGallery = async (callBack: (values: ImageOrVideo) => void, options?: Options) => {
    const mediaType = options?.mediaType || 'photo'
    try {
      const fileInfo = (await openPicker({ ...optionsDefault[mediaType], ...options })) as ImageOrVideo
      const infoMedia = await uploadMedia(fileInfo, mediaType)
      callBack(infoMedia)
    } catch (error) {
      log(JSON.stringify(error))
    }
  }

  return {
    takePhotoOrVideo,
    takePhotoOrVideoFromGallery,
  }
}
