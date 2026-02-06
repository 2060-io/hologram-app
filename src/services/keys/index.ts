import { TypedArrayEncoder } from '@credo-ts/core'
import { Key, KeyAlgorithm } from '@openwallet-foundation/askar-react-native'

import { ConfigJsonSignature, PARENTAL_CONTROL } from '../config'

import { logError } from '@2060/utils'
import { CONFIG_FILE_PATH, readFile, writeFile } from '@2060/utils/RNFS'

export enum KeyChainService {
  AfjWallet = 'afj-wallet',
  RealmMain = 'realm-main',
  Backup = 'backup',
  ParentalControlPIN = 'parental-control-pin',
}

export async function retrieveEncryptedKey(service: KeyChainService) {
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    const configJson = JSON.parse(config)
    return (configJson.keys[service] as string) ?? undefined
  } catch (error) {
    return undefined
  }
}

export async function createAndStoreEncryptedKey(service: KeyChainService, seed?: string) {
  const key = seed ? aes256KeyFromSeed(seed) : Key.generate(KeyAlgorithm.AesA256CbcHs512).secretBytes

  let configJson: ConfigJsonSignature
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    configJson = JSON.parse(config)
  } catch (error) {
    configJson = { keys: {}, [PARENTAL_CONTROL]: {} }
  }

  configJson.keys[service] = TypedArrayEncoder.toHex(key)
  await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))

  return configJson.keys[service]
}

export async function deleteEncryptedKey(service: KeyChainService) {
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    const configJson = JSON.parse(config)
    delete configJson.keys[service]
    await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))
    return configJson.keys
  } catch (error) {
    logError(`error deleting key ${service}: ${error}`)
    return undefined
  }
}

export async function deleteAllKeys() {
  try {
    const configJson = {} as ConfigJsonSignature
    configJson.keys = {}
    configJson[PARENTAL_CONTROL] = {}
    await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))
  } catch (error) {
    logError(`error deleting keys: ${error}`)
  }
}

export function aes256KeyFromSeed(seed: string) {
  return Key.fromSeed({
    algorithm: KeyAlgorithm.AesA256CbcHs512,
    seed: TypedArrayEncoder.fromString(seed),
  }).secretBytes
}
