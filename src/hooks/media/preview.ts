import ImageResizer from '@bam.tech/react-native-image-resizer'
import { moveFile } from '@dr.pogodin/react-native-fs'
import { IS_ANDROID } from '@src/constants'
import { dataUrl, logError } from '@src/utils'
import {
  deleteFile,
  existsFile,
  getLocalMediaPreviewFilePath,
  makeDirectory,
  mediaPreviewsDirectoryPath,
  readFile,
} from '@src/utils/RNFS'
import { createThumbnail } from 'react-native-create-thumbnail'

export const LOCAL_PREVIEW_IMAGE_WIDTH = 512
const LOCAL_PREVIEW_IMAGE_HEIGHT = 512
export const LOCAL_PREVIEW_IMAGE_QUALITY = 70

const DIDCOMM_PREVIEW_IMAGE_WIDTH = 128
const DIDCOMM_PREVIEW_IMAGE_HEIGHT = 128
const DIDCOMM_PREVIEW_IMAGE_QUALITY = 50

export async function createLocalPreview(options: { mimeType: string; localFilePath: string }) {
  const { mimeType, localFilePath } = options
  let localPreviewFilePath: string | undefined
  if (mimeType.startsWith('video')) {
    const thumbnailResponse = await createVideoThumbnail({
      videoPath: localFilePath,
      maxWidth: LOCAL_PREVIEW_IMAGE_WIDTH,
      maxHeight: LOCAL_PREVIEW_IMAGE_HEIGHT,
      quality: LOCAL_PREVIEW_IMAGE_QUALITY,
    })
    localPreviewFilePath = thumbnailResponse?.path
  } else if (mimeType.startsWith('image')) {
    const previewResponse = await createResizedImage({
      imageUrl: localFilePath,
      maxWidth: LOCAL_PREVIEW_IMAGE_WIDTH,
      maxHeight: LOCAL_PREVIEW_IMAGE_HEIGHT,
      quality: LOCAL_PREVIEW_IMAGE_QUALITY,
    })
    if (previewResponse) localPreviewFilePath = previewResponse.path
  }

  // save preview under previews directory
  // TODO: this should be actually done directly by createVideoThumbnail/createResizedImage
  if (localPreviewFilePath) {
    const previewFileNameWithoutExtension = localFilePath.split('/').at(-1)?.split('.').at(0)
    const previewFileName = `${previewFileNameWithoutExtension}.jpeg`
    const previewMediaDestinationPath = `${getLocalMediaPreviewFilePath(previewFileName)}`
    const existPreviewFile = await existsFile(previewMediaDestinationPath)
    if (!existPreviewFile) {
      // Create media previews directory if not exists
      await makeDirectory(mediaPreviewsDirectoryPath)
      await moveFile(localPreviewFilePath, previewMediaDestinationPath)
    }
    return `media/previews/${previewFileName}`
  }
  return undefined
}

export async function createDidCommPreview(options: { mimeType: string; localFilePath: string }) {
  const { mimeType, localFilePath } = options
  let didcommPreview: string | undefined
  if (mimeType.startsWith('video')) {
    const thumbnailResponse = await createVideoThumbnail({
      videoPath: localFilePath,
      maxWidth: DIDCOMM_PREVIEW_IMAGE_WIDTH,
      maxHeight: DIDCOMM_PREVIEW_IMAGE_HEIGHT,
      quality: DIDCOMM_PREVIEW_IMAGE_QUALITY,
    })
    if (thumbnailResponse) {
      didcommPreview = thumbnailResponse.base64
      // Clean up file
      await deleteFile(thumbnailResponse.path)
    }
  } else if (mimeType.startsWith('image')) {
    const previewResponse = await createResizedImage({
      imageUrl: localFilePath,
      maxWidth: DIDCOMM_PREVIEW_IMAGE_WIDTH,
      maxHeight: DIDCOMM_PREVIEW_IMAGE_HEIGHT,
      quality: DIDCOMM_PREVIEW_IMAGE_QUALITY,
    })
    if (previewResponse) {
      didcommPreview = previewResponse.base64
      await deleteFile(previewResponse.path)
    }
  }

  return didcommPreview
}

async function createVideoThumbnail(options: {
  videoPath: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
}) {
  const { videoPath, maxWidth, maxHeight, quality } = options
  try {
    const { path } = await createThumbnail({
      url: IS_ANDROID ? `file://${videoPath}` : videoPath,
      maxHeight: maxHeight ?? DIDCOMM_PREVIEW_IMAGE_WIDTH,
      maxWidth: maxWidth ?? DIDCOMM_PREVIEW_IMAGE_HEIGHT,
      quality: quality ?? DIDCOMM_PREVIEW_IMAGE_QUALITY,
    })
    const data = await readFile(path, 'base64')
    return { path, base64: dataUrl('image/jpeg', data) }
  } catch (error) {
    logError('error in createVideoThumbnail', error)
    return undefined
  }
}

export async function createResizedImage(options: {
  imageUrl: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
}) {
  try {
    const { imageUrl, maxWidth, maxHeight, quality } = options
    const resizedImage = await ImageResizer.createResizedImage(
      imageUrl,
      maxWidth ?? DIDCOMM_PREVIEW_IMAGE_WIDTH,
      maxHeight ?? DIDCOMM_PREVIEW_IMAGE_HEIGHT,
      'JPEG',
      quality ?? DIDCOMM_PREVIEW_IMAGE_QUALITY
    )
    const data = await readFile(resizedImage.path, 'base64')
    return { path: resizedImage.path, base64: dataUrl('image/jpeg', data) }
  } catch (error) {
    logError(`Error creating resized image: ${error}`)
    return null
  }
}
