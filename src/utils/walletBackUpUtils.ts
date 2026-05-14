import { readdir, TemporaryDirectoryPath } from '@dr.pogodin/react-native-fs'
import {
  createAndStoreEncryptedKey,
  deleteEncryptedKey,
  KeyChainService,
  retrieveEncryptedKey,
} from '@src/services/keys'
import Config from 'react-native-config'
import { unzip, zip } from 'react-native-zip-archive'
import { logError } from './log'
import { deleteDir, existsFile as exists, makeDirectory, mediaDirectoryPath } from './RNFS'

const BACKUP_NAME = Config.BACKUP_NAME
const ROOT_TEMP_FILES_DIRECTORY = `${TemporaryDirectoryPath}/.Hologram`
const TEMP_BACKUP_FILES_DIRECTORY = `${ROOT_TEMP_FILES_DIRECTORY}/input`
const BACKUP_ZIP_FILE_PATH = `${ROOT_TEMP_FILES_DIRECTORY}/${BACKUP_NAME}`
const MEDIA_BACKUP_FILE_PATH = `${TEMP_BACKUP_FILES_DIRECTORY}/media.zip`
const REALM_BACKUP_FILE_PATH = `${TEMP_BACKUP_FILES_DIRECTORY}/main.realm`
const AFJ_BACKUP_FILE_PATH = `${TEMP_BACKUP_FILES_DIRECTORY}/afj.sqlite`
const BACKUP_MANIFEST_FILE_PATH = `${TEMP_BACKUP_FILES_DIRECTORY}/info.json`

const deleteBackupDirectory = async () => {
  try {
    if (await existsBackupDirectory()) {
      await deleteDir(ROOT_TEMP_FILES_DIRECTORY)
    }
  } catch (error) {
    logError('Error removing temp back up files', error)
  }
}

const existsBackupDirectory = async () => exists(ROOT_TEMP_FILES_DIRECTORY)

const existsBackupFile = async () => exists(BACKUP_ZIP_FILE_PATH)

const createBackupDirectory = async () => await makeDirectory(TEMP_BACKUP_FILES_DIRECTORY)

const zipBackup = async (includeMedia: boolean) => {
  const existsMediaDirectory = (await exists(mediaDirectoryPath)) && (await readdir(mediaDirectoryPath)).length
  if (includeMedia && existsMediaDirectory) await zipMediaFiles()
  try {
    const zipPath = await zip(TEMP_BACKUP_FILES_DIRECTORY, BACKUP_ZIP_FILE_PATH)
    return zipPath
  } catch (error) {
    logError('Error zipping files', error)
    return null
  }
}

const zipMediaFiles = async () => {
  const zipTargetPath = MEDIA_BACKUP_FILE_PATH
  try {
    const zipPath = await zip(mediaDirectoryPath, zipTargetPath)
    return zipPath
  } catch (error) {
    logError('Error zipping media files', error)
    return null
  }
}

const unzipBackup = async () => {
  try {
    const unzipPath = await unzip(BACKUP_ZIP_FILE_PATH, TEMP_BACKUP_FILES_DIRECTORY)
    return unzipPath
  } catch (error) {
    logError('Error unzipping files', `${error}`)
    return null
  }
}

const unzipMediaFiles = async () => {
  try {
    // Make sure media directory exists
    await makeDirectory(mediaDirectoryPath)

    const existsMediaZip = await exists(MEDIA_BACKUP_FILE_PATH)
    if (existsMediaZip) await unzip(MEDIA_BACKUP_FILE_PATH, mediaDirectoryPath)
  } catch (error) {
    logError('Error unzipping media files', error)
  }
}

const getBackupKey = async () => retrieveEncryptedKey(KeyChainService.Backup)

const setBackupKey = (seed: string) => createAndStoreEncryptedKey(KeyChainService.Backup, seed)

const deleteBackupKey = async () => deleteEncryptedKey(KeyChainService.Backup)

export {
  AFJ_BACKUP_FILE_PATH,
  BACKUP_MANIFEST_FILE_PATH,
  BACKUP_NAME,
  BACKUP_ZIP_FILE_PATH,
  createBackupDirectory,
  deleteBackupDirectory,
  deleteBackupKey,
  existsBackupFile,
  getBackupKey,
  REALM_BACKUP_FILE_PATH,
  setBackupKey,
  unzipBackup,
  unzipMediaFiles,
  zipBackup,
}
