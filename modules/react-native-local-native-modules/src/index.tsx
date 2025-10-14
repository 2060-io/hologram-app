import FileChunkGenerator from './NativeFileChunkGenerator'
import NativeFileCiphering from './NativeFileCiphering'
import NativeGoogleDrive from './NativeGoogleDrive'
import VideoProperties, { MediaInfo } from './NativeVideoProperties'

export function getVideoProperties(videoPath: string): Promise<MediaInfo> {
  return VideoProperties.getVideoProperties(videoPath)
}

export function createChunks(
  filePath: string,
  outputFilePathPrefix: string,
  chunkSize: number,
): Promise<string[]> {
  return FileChunkGenerator.createChunks(filePath, outputFilePathPrefix, chunkSize)
}

export function randomKey(length: number): Promise<string> {
  return NativeFileCiphering.randomKey(length)
}

export function encryptFile(
  filePath: string,
  outputPath: string,
  key: string,
  iv: string,
  algorithm: string,
): Promise<boolean> {
  return NativeFileCiphering.encryptFile(filePath, outputPath, key, iv, algorithm)
}
export function decryptFile(
  filePath: string,
  outputPath: string,
  key: string,
  iv: string,
  algorithm: string,
): Promise<boolean> {
  return NativeFileCiphering.decryptFile(filePath, outputPath, key, iv, algorithm)
}

export function googleDriveAuthorize(accountName: string): Promise<boolean> {
  return NativeGoogleDrive.authorize(accountName)
}

export function googleDriveGetAccessToken(): Promise<string> {
  return NativeGoogleDrive.getAccessToken()
}

export function googleDriveSelectAccount(accountName?: string): Promise<string | undefined> {
  return NativeGoogleDrive.selectAccount(accountName)
}
