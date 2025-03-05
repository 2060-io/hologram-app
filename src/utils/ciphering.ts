import { CipheringInfo } from '@2060.io/credo-ts-didcomm-media-sharing'
import { NativeModules } from 'react-native'

import { logError } from './log'

const { FileCipheringModule } = NativeModules

export async function encryptFile(encryptOptions: {
  originFilePath: string
  destinationFilePath: string
}): Promise<CipheringInfo> {
  const { originFilePath, destinationFilePath } = encryptOptions
  // Create ciphering parameters
  const key = await FileCipheringModule.randomKey(32)
  const iv = await FileCipheringModule.randomKey(16)
  const ciphering = {
    algorithm: 'aes-256-cbc',
    parameters: {
      key,
      iv,
    },
  }

  await FileCipheringModule.encryptFile(originFilePath, destinationFilePath, key, iv, 'aes-256-cbc')

  return ciphering
}

export async function decryptFile(decryptOptions: {
  originFilePath: string
  destinationFilePath: string
  cipheringInfo: CipheringInfo
}) {
  const { originFilePath, destinationFilePath, cipheringInfo } = decryptOptions

  const algorithm = cipheringInfo.algorithm
  const iv = cipheringInfo.parameters.iv
  const key = cipheringInfo.parameters.key
  if (!algorithm || !iv || !key) {
    logError('There are some missing ciphering parameters')
    throw Error('There are some missing ciphering parameters')
  }

  await FileCipheringModule.decryptFile(originFilePath, destinationFilePath, key, iv, algorithm)
}
