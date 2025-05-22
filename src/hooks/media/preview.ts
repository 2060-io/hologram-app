import ImageResizer from '@bam.tech/react-native-image-resizer'
import { createThumbnail } from 'react-native-create-thumbnail'
import { moveFile } from 'react-native-fs'

import { dataUrl, logError } from '@2060/utils'
import {
  deleteFile,
  existsFile,
  getLocalMediaPreviewFilePath,
  makeDirectory,
  mediaPreviewsDirectoryPath,
  readFile,
} from '@2060/utils/RNFS'

const LOCAL_PREVIEW_IMAGE_WIDTH = 512
const LOCAL_PREVIEW_IMAGE_HEIGHT = 512
const LOCAL_PREVIEW_IMAGE_QUALITY = 70

const DIDCOMM_PREVIEW_IMAGE_WIDTH = 128
const DIDCOMM_PREVIEW_IMAGE_HEIGHT = 128
const DIDCOMM_PREVIEW_IMAGE_QUALITY = 50

export async function createLocalPreview(options: { mimeType: string; localFilePath: string }) {
  const { mimeType, localFilePath } = options
  let localPreviewFilePath: string | undefined
  if (mimeType.startsWith('video')) {
    const thumbnailResponse = await createVideoThumbnail({
      videoPath: `file://${localFilePath}`,
      maxWidth: LOCAL_PREVIEW_IMAGE_WIDTH,
      maxHeight: LOCAL_PREVIEW_IMAGE_HEIGHT,
      quality: LOCAL_PREVIEW_IMAGE_QUALITY,
    })
    localPreviewFilePath = thumbnailResponse?.path
  } else if (mimeType.startsWith('image')) {
    const previewResponse = await createImagePreview({
      imageUrl: localFilePath,
      maxWidth: LOCAL_PREVIEW_IMAGE_WIDTH,
      maxHeight: LOCAL_PREVIEW_IMAGE_HEIGHT,
      quality: LOCAL_PREVIEW_IMAGE_QUALITY,
    })
    localPreviewFilePath = previewResponse.path
  }

  // save preview under previews directory
  // TODO: this should be actually done directly by createVideoThumbnail/createImagePreview
  if (localPreviewFilePath) {
    const [previewFileName] = localFilePath.split('/').slice(-1)
    const previewMediaDestinationPath = `${getLocalMediaPreviewFilePath(previewFileName)}.jpeg`

    const existPreviewFile = await existsFile(previewMediaDestinationPath)
    if (!existPreviewFile) {
      // Create media previews directory if not existant
      await makeDirectory(mediaPreviewsDirectoryPath)

      await moveFile(localPreviewFilePath, previewMediaDestinationPath)
      localPreviewFilePath = previewMediaDestinationPath
    }
  }

  return localPreviewFilePath
}

export async function createDidCommPreview(options: { mimeType: string; localFilePath: string }) {
  const { mimeType, localFilePath } = options
  let didcommPreview: string | undefined
  if (mimeType.startsWith('video')) {
    const thumbnailResponse = await createVideoThumbnail({
      videoPath: `file://${localFilePath}`,
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
    const previewResponse = await createImagePreview({
      imageUrl: localFilePath,
      maxWidth: DIDCOMM_PREVIEW_IMAGE_WIDTH,
      maxHeight: DIDCOMM_PREVIEW_IMAGE_HEIGHT,
      quality: DIDCOMM_PREVIEW_IMAGE_QUALITY,
    })
    didcommPreview = previewResponse.base64

    // Clean up file
    await deleteFile(previewResponse.path)
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
      url: videoPath,
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

async function createImagePreview(options: {
  imageUrl: string
  maxWidth?: number
  maxHeight?: number
  quality?: number
}) {
  const { imageUrl, maxWidth, maxHeight, quality } = options
  const preview = await ImageResizer.createResizedImage(
    imageUrl,
    maxWidth ?? DIDCOMM_PREVIEW_IMAGE_WIDTH,
    maxHeight ?? DIDCOMM_PREVIEW_IMAGE_HEIGHT,
    'JPEG',
    quality ?? DIDCOMM_PREVIEW_IMAGE_QUALITY,
  )

  const data = await readFile(preview.path, 'base64')
  return { path: preview.path, base64: dataUrl('image/jpeg', data) }
}
