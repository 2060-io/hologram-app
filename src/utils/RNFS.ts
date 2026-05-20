import {
  DocumentDirectoryPath,
  copyFile as RNFSCopyFile,
  exists as RNFSExists,
  mkdir as RNFSMakeDirectory,
  moveFile as RNFSMoveFile,
  readFile as RNFSReadFile,
  unlink as RNFSUnlink,
  writeFile as RNFSWriteFile,
} from '@dr.pogodin/react-native-fs'
import { IS_IOS } from '@src/constants'
import { logError } from './log'

type Encoding = 'utf8' | 'base64' | 'ascii'
const CONFIG_FILE_PATH = `${DocumentDirectoryPath}/config.json`
const mediaDirectoryPath = `${DocumentDirectoryPath}/media`
const mediaPreviewsDirectoryPath = `${DocumentDirectoryPath}/media/previews`
const walletDirectoryPath = `${DocumentDirectoryPath}/wallet`
const getLocalMediaFilePath = (fileName: string) => `${mediaDirectoryPath}/${fileName}`
const getLocalMediaPreviewFilePath = (fileName: string) => `${mediaPreviewsDirectoryPath}/${fileName}`
const getFullLocalFilePath = (relativeFilePath: string) => `${DocumentDirectoryPath}/${relativeFilePath}`

const getLocalFileUri = (relativeFilePath: string) => {
  return IS_IOS ? getFullLocalFilePath(relativeFilePath) : `file://${getFullLocalFilePath(relativeFilePath)}`
}

const readFile = async (path: string, encodingOrOptions: Encoding = 'utf8') => {
  const response = await RNFSReadFile(path, encodingOrOptions)
  return response
}

const writeFile = async (filePath: string, content: string, encodingOrOptions: Encoding = 'utf8') => {
  try {
    await RNFSWriteFile(filePath, content, encodingOrOptions)
  } catch (error) {
    logError(`writeFile: ${error}`)
  }
}

const makeDirectory = async (folderPath: string) => {
  try {
    await RNFSMakeDirectory(folderPath) //create a new folder on folderPath
  } catch (error) {
    logError('Error create dir', error)
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

const existsFile = async (filePath: string) => {
  try {
    return await RNFSExists(filePath)
  } catch {
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
  CONFIG_FILE_PATH,
  copyFile,
  deleteDir,
  deleteFile,
  existsFile,
  getFileExtension,
  getFullLocalFilePath,
  getLocalFileUri,
  getLocalMediaFilePath,
  getLocalMediaPreviewFilePath,
  makeDirectory,
  mediaDirectoryPath,
  mediaPreviewsDirectoryPath,
  moveFile,
  readFile,
  walletDirectoryPath,
  writeFile,
}
