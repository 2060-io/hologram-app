import { Image } from 'react-native'
import { Video as VideoCompressor } from 'react-native-compressor'
import { exists, stat, TemporaryDirectoryPath } from 'react-native-fs'
import { getVideoProperties } from 'react-native-local-native-modules'

import { copyFile, deleteFile } from './RNFS'
import { logError } from './log'

import { IS_IOS } from '@src/constants'
import { DidCommMediaFileSharingData } from '@src/hooks/agent'
import { createDidCommPreview } from '@src/hooks/media/preview'

export const getMediaFileSharingData = async (fileOriginalPath: string, mimeType: string) => {
  const filePath = await fromContentUriToFileUri(fileOriginalPath)
  const preview = await createDidCommPreview({ mimeType: mimeType, localFilePath: filePath })
  const { size } = await stat(filePath)
  const commonFileValues: DidCommMediaFileSharingData = {
    path: filePath,
    mime: mimeType,
    preview,
    size,
  }
  const mediaFileSharingData = mimeType.startsWith('video')
    ? getDataForVideo(commonFileValues)
    : getDataForImage(commonFileValues)
  return mediaFileSharingData
}

const fromContentUriToFileUri = async (contentUri: string) => {
  const urlComponents = contentUri.split('/')
  const fileNameAndExtension = urlComponents[urlComponents.length - 1]
  const destPath = `${TemporaryDirectoryPath}/${fileNameAndExtension}`
  await copyFile(contentUri, destPath)
  return IS_IOS ? destPath : `file://${decodeURIComponent(destPath)}`
}

/**
 * Retrieves information about a media file, including its size and MIME type.
 *
 * @param filePath - The path to the media file.
 * @returns An object containing the file's size (in bytes) and its MIME type.
 * @throws If the file does not exist or an error occurs during retrieval.
 *
 * @example
 * ```typescript
 * const info = await getMediaInfo('/path/to/file.jpg');
 * // info: { size: 1024, mimeType: 'image/jpeg' }
 * ```
 */
export const getMediaInfo = async (filePath: string) => {
  try {
    const fileExists = await exists(filePath)
    if (!fileExists) {
      throw new Error('File does not exist')
    }

    const fileInfo = await stat(filePath)
    const { size } = fileInfo
    let mimeType = 'application/octet-stream' // Default MIME type
    const fileExtension = filePath.split('.').pop()?.toLowerCase()
    if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      mimeType = 'image/jpeg'
    } else if (fileExtension === 'png') {
      mimeType = 'image/png'
    } else if (fileExtension === 'mp4') {
      mimeType = 'video/mp4'
    } else if (fileExtension === 'mov') {
      mimeType = 'video/quicktime'
    }
    return { size, mimeType }
  } catch (error) {
    throw error
  }
}

const getDataForVideo = async (currentFileValues: DidCommMediaFileSharingData) => {
  let duration = 0
  let width = 0
  let height = 0
  try {
    const properties = await getVideoProperties(currentFileValues.path)
    if (properties) {
      duration = properties.duration
      width = properties.width
      height = properties.height
    }
  } catch (error) {
    logError('Error getting video properties:', error)
  } finally {
    return {
      ...currentFileValues,
      duration,
      width,
      height,
    }
  }
}

const getDataForImage = async (currentFileValues: DidCommMediaFileSharingData) => {
  try {
    const { width, height } = await getImageDimensions(currentFileValues.path)
    return {
      ...currentFileValues,
      width,
      height,
    }
  } catch (error) {
    logError(`${error}`)
    return currentFileValues
  }
}

const getImageDimensions = (filePath: string) => {
  return new Promise<{
    width: number
    height: number
  }>((resolve, reject) => {
    Image.getSize(
      filePath,
      (width, height) => resolve({ width, height }),
      error => {
        reject(`error getting filePath dimensions: ${error}`)
      },
    )
  })
}

// This is 2 millions of bits per second (0.25 MB)
const COMPRESSION_BITRATE = 2_000_000
export const compressVideo = async (
  fileInfo: DidCommMediaFileSharingData,
  onProgress: (progress: number) => void,
  getCancellationId?: (cancellationId: string) => void,
): Promise<DidCommMediaFileSharingData> => {
  try {
    const compressedVideoPath = await VideoCompressor.compress(
      fileInfo.path,
      {
        compressionMethod: 'manual',
        bitrate: COMPRESSION_BITRATE,
        progressDivider: 5,
        getCancellationId,
      },
      progress => onProgress(Math.ceil(progress * 100)),
    )
    await deleteFile(fileInfo.path)
    fileInfo.path = compressedVideoPath
    fileInfo.mime = 'video/mp4'
    const { size } = await stat(compressedVideoPath)
    fileInfo.size = size
    return fileInfo
  } catch (error) {
    logError(`Error compressing video: ${error}`)
    return fileInfo
  } finally {
    onProgress(0)
  }
}

export const cancelVideoCompression = (cancellationId: string) => {
  VideoCompressor.cancelCompression(cancellationId)
}
