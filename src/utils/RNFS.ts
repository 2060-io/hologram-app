import {
  DocumentDirectoryPath,
  readFile as RNFSReadFile,
  writeFile as RNFSWriteFile,
  appendFile as RNFSAppendFile,
  mkdir as RNFSMakeDirectory,
  readDir as RNFSReadDir,
  unlink as RNFSUnlink,
  copyFile as RNFSCopyFile,
  copyAssetsFileIOS as RNFSCopyFileIOS,
  exists as RNFSExists,
  moveFile as RNFSMoveFile,
} from 'react-native-fs'

import { logError } from './log'

import { IS_IOS } from '@2060/constants'

type Encoding = 'utf8' | 'base64' | 'ascii'

const documentDirectoryPath = DocumentDirectoryPath
const mediaDirectoryPath = `${documentDirectoryPath}/media`
const mediaPreviewsDirectoryPath = `${documentDirectoryPath}/media/previews`
const walletDirectoryPath = `${documentDirectoryPath}/wallet`
const getLocalMediaFilePath = (fileName: string) => `${mediaDirectoryPath}/${fileName}`
const getLocalMediaPreviewFilePath = (fileName: string) => `${mediaPreviewsDirectoryPath}/${fileName}`
const getFullLocalFilePath = (relativeFilePath: string) => `${documentDirectoryPath}/${relativeFilePath}`

const getLocalFileUri = (relativeFilePath: string) => {
  return IS_IOS ? getFullLocalFilePath(relativeFilePath) : `file://${getFullLocalFilePath(relativeFilePath)}`
}

const readFile = async (path: string, encodingOrOptions: Encoding = 'utf8') => {
  try {
    const response = await RNFSReadFile(path, encodingOrOptions)
    return response
  } catch (error) {
    logError(`readFile: ${error}`)
  }
}

const writeFile = async (filePath: string, content: string, encodingOrOptions: Encoding = 'utf8') => {
  try {
    await RNFSWriteFile(filePath, content, encodingOrOptions)
  } catch (error) {
    logError(`writeFile: ${error}`)
  }
}

const appendFile = async (filePath: string, content: string, encodingOrOptions: Encoding = 'utf8') => {
  try {
    await RNFSAppendFile(filePath, content, encodingOrOptions)
  } catch (error) {
    logError(`appendFile: ${error}`)
  }
}

const makeDirectory = async (folderPath: string) => {
  try {
    await RNFSMakeDirectory(folderPath) //create a new folder on folderPath
  } catch (error) {
    logError('Error create dir', error)
  }
}

const getFileContent = async (filePath: string) => {
  try {
    const reader = await RNFSReadDir(filePath)
    return reader
  } catch (error) {
    logError('error get content', error)
  }
}

const getFileExtension = (filePath: string) => {
  // eslint-disable-next-line no-bitwise
  return filePath.slice(((filePath.lastIndexOf('.') - 1) >>> 0) + 2)
}

const deleteFile = async (filePath: string) => {
  try {
    if (await existsFile(filePath)) await RNFSUnlink(filePath)
  } catch (error) {
    logError(`Error deleting file: ${filePath} - ${error}`)
  }
}

const deleteDir = deleteFile

const copyFile = async (filePath: string, destPath: string) => {
  try {
    await RNFSCopyFile(filePath, destPath)
  } catch (error) {
    logError('Error copy file', error)
  }
}
const copyFileIOS = async (imageUri: string, destPath: string) => {
  try {
    await RNFSCopyFileIOS(imageUri, destPath, 0, 0)
  } catch (error) {
    logError(`copyFileIOS ${error}`)
  }
}

const existsFile = async (filePath: string) => {
  try {
    return await RNFSExists(filePath)
  } catch (error) {
    return false
  }
}

const moveFile = async (filePath: string, destPath: string) => {
  try {
    // Do not overwrite files
    if (await existsFile(destPath)) return
    await RNFSMoveFile(filePath, destPath)
  } catch (error) {
    logError(`moveFile: ${error}`)
  }
}

export {
  readFile,
  writeFile,
  appendFile,
  makeDirectory,
  getFileContent,
  deleteFile,
  deleteDir,
  copyFile,
  moveFile,
  copyFileIOS,
  documentDirectoryPath,
  mediaDirectoryPath,
  mediaPreviewsDirectoryPath,
  walletDirectoryPath,
  getLocalMediaFilePath,
  getLocalMediaPreviewFilePath,
  getFullLocalFilePath,
  getFileExtension,
  getLocalFileUri,
  existsFile,
}
