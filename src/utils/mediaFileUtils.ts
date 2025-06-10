import { Image } from 'react-native'
import { Video as VideoCompressor } from 'react-native-compressor'
import { stat, TemporaryDirectoryPath } from 'react-native-fs'
import { ImageOrVideo } from 'react-native-image-crop-picker'
import { nativeGetVideoProperties } from 'react-native-local-native-modules'

import { copyFile, deleteFile } from './RNFS'
import { logError } from './log'

import { IS_IOS } from '@2060/constants'
import { DidCommMediaFileSharingData } from '@2060/hooks/agent'
import { createDidCommPreview } from '@2060/hooks/media/preview'

export const getMediaFileSharingData = async (fileOriginalPath: string, mimeType: string) => {
  const filePath = await fromContentUriToFileUri(fileOriginalPath)
  const preview = await createDidCommPreview({ mimeType: mimeType, localFilePath: filePath })
  const { size } = await stat(filePath)
  const [fileName] = filePath.split('/').slice(-1)
  const finalFileName = fileName.includes('.') ? fileName : undefined
  const commonFileValues: DidCommMediaFileSharingData = {
    path: filePath,
    mime: mimeType,
    preview,
    size,
    fileName: finalFileName,
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
  return IS_IOS ? destPath : decodeURIComponent(destPath)
}

const getDataForVideo = async (currentFileValues: DidCommMediaFileSharingData) => {
  let duration = 0
  let width = 0
  let height = 0
  try {
    const properties = await nativeGetVideoProperties(currentFileValues.path)
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

export const compressVideo = async (
  fileInfo: ImageOrVideo | DidCommMediaFileSharingData,
  onProgress: (progress: number) => void,
): Promise<ImageOrVideo | DidCommMediaFileSharingData> => {
  try {
    const compressedVideoPath = await VideoCompressor.compress(
      fileInfo.path,
      { compressionMethod: 'manual', bitrate: 691200, progressDivider: 5 },
      progress => onProgress(Math.ceil(progress * 100)),
    )
    await deleteFile(fileInfo.path)
    fileInfo.path = compressedVideoPath
    const { size } = await stat(compressedVideoPath)
    fileInfo.size = size
  } catch (error) {
    logError(`Error compressing video: ${error}`)
  } finally {
    onProgress(0)
    return fileInfo
  }
}
