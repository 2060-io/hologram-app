import { Image } from 'react-native'
import { stat, TemporaryDirectoryPath } from 'react-native-fs'
import { nativeGetVideoProperties } from 'react-native-local-native-modules'

import { copyFile } from './RNFS'
import { logError } from './log'

import { IS_DEVICE_IOS } from '@2060/constants'
import { DidCommMediaFileSharingData } from '@2060/hooks/agent'
import { createDidCommPreview } from '@2060/hooks/media/preview'

type VideoProps = {
  duration: number
  width: number
  height: number
}

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
  return IS_DEVICE_IOS ? destPath : `file://${decodeURIComponent(destPath)}`
}

const getDataForVideo = async (currentFileValues: DidCommMediaFileSharingData) => {
  let duration = 0
  let width = 0
  let height = 0
  try {
    const properties = (await nativeGetVideoProperties(currentFileValues.path)) as VideoProps
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
