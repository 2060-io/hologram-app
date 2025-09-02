import FileChunkGenerator from './NativeFileChunkGenerator'
import NativeFileCipheringModule from './NativeFileCipheringModule'
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

export function readChunk(filePath: string, offset: number, length: number): Promise<number[]> {
  return FileChunkGenerator.readChunk(filePath, offset, length)
}

export function randomKey(length: number): Promise<string> {
  return NativeFileCipheringModule.randomKey(length)
}

export function encryptFile(
  filePath: string,
  outputPath: string,
  key: string,
  iv: string,
  algorithm: string,
): Promise<boolean> {
  return NativeFileCipheringModule.encryptFile(filePath, outputPath, key, iv, algorithm)
}
export function decryptFile(
  filePath: string,
  outputPath: string,
  key: string,
  iv: string,
  algorithm: string,
): Promise<boolean> {
  return NativeFileCipheringModule.decryptFile(filePath, outputPath, key, iv, algorithm)
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
