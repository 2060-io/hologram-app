import { NativeModules, Platform } from 'react-native'

const LINKING_ERROR = (nativeModule: string) =>
  `The package ${nativeModule} doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

// Native Video Properties Module and its functions
const VideoPropertiesNativeModule = NativeModules.VideoPropertiesModule
  ? NativeModules.VideoPropertiesModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR('VideoPropertiesModule'))
        },
      },
    )

type VideoProps = {
  duration: number
  width: number
  height: number
}

export function nativeGetVideoProperties(videoPath: string): Promise<VideoProps | null> {
  return VideoPropertiesNativeModule.getVideoProperties(videoPath)
}

// Native File Ciphering Module and its functions
const FileCipheringNativeModule = NativeModules.FileCipheringModule
  ? NativeModules.FileCipheringModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR('FileCipheringModule'))
        },
      },
    )

export function nativeRandomKey(length: number): Promise<string> {
  return FileCipheringNativeModule.randomKey(length)
}

export function nativeEncryptFile(
  filePath: string,
  outputPath: string,
  key: string,
  iv: string,
  algorithm: string,
): Promise<boolean> {
  return FileCipheringNativeModule.encryptFile(filePath, outputPath, key, iv, algorithm)
}

export function nativeDecryptFile(
  filePath: string,
  outputPath: string,
  key: string,
  iv: string,
  algorithm: string,
): Promise<boolean> {
  return FileCipheringNativeModule.decryptFile(filePath, outputPath, key, iv, algorithm)
}

//Native File Chunk Generator Module and functions
const FileChunkGeneratorNativeModule = NativeModules.FileChunkGeneratorModule
  ? NativeModules.FileChunkGeneratorModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR('FileChunkGeneratorModule'))
        },
      },
    )

export function nativeCreateChunks(
  filePath: string,
  outputFilePathPrefix: string,
  chunkSize: number,
): Promise<string[]> {
  return FileChunkGeneratorNativeModule.createChunks(filePath, outputFilePathPrefix, chunkSize)
}

export function nativeReadChunk(filePath: string, offset: number, length: number): Promise<number[]> {
  return FileChunkGeneratorNativeModule.readChunk(filePath, offset, length)
}

//Native Google Drive Authorization Module  and its functions
const GDriveAuthorizationNativeModule = NativeModules.GDriveAuthorizationModule
  ? NativeModules.GDriveAuthorizationModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR('GDriveAuthorizationModule'))
        },
      },
    )

export function nativeGDAuthorize(accountName: string): Promise<boolean> {
  return GDriveAuthorizationNativeModule.authorize(accountName)
}

export function nativeGDGetAccessToken(): Promise<string> {
  return GDriveAuthorizationNativeModule.getAccessToken()
}

export function nativeGDSelectAccount(accountName?: string): Promise<string | undefined> {
  return GDriveAuthorizationNativeModule.selectAccount(accountName)
}
