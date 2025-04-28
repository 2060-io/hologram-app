import { CipheringInfo } from '@2060.io/credo-ts-didcomm-media-sharing'

import { logError } from './log'

import { nativeRandomKey, nativeEncryptFile, nativeDecryptFile } from 'react-native-local-native-modules'

export async function encryptFile(encryptOptions: {
  originFilePath: string
  destinationFilePath: string
}): Promise<CipheringInfo> {
  const { originFilePath, destinationFilePath } = encryptOptions
  // Create ciphering parameters
  const key = await nativeRandomKey(32)
  const iv = await nativeRandomKey(16)
  const ciphering = {
    algorithm: 'aes-256-cbc',
    parameters: {
      key,
      iv,
    },
  }

  await nativeEncryptFile(originFilePath, destinationFilePath, key, iv, 'aes-256-cbc')

  return ciphering
}

export async function decryptFile(decryptOptions: {
  originFilePath: string
  destinationFilePath: string
  cipheringInfo: CipheringInfo
}) {
  const { originFilePath, destinationFilePath, cipheringInfo } = decryptOptions

  const algorithm = cipheringInfo.algorithm
  const iv = cipheringInfo.parameters.iv as string
  const key = cipheringInfo.parameters.key as string
  if (!algorithm || !iv || !key) {
    logError('There are some missing ciphering parameters')
    throw Error('There are some missing ciphering parameters')
  }

  await nativeDecryptFile(originFilePath, destinationFilePath, key, iv, algorithm)
}
