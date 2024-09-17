import { TypedArrayEncoder } from '@credo-ts/core'
import { Key, KeyAlgs } from '@hyperledger/aries-askar-react-native'
import * as RNFS from 'react-native-fs'

import { logWarn } from '@2060/utils'

export const configFilePath = `${RNFS.DocumentDirectoryPath}/config.json`

export enum KeyChainService {
  AfjWallet = 'afj-wallet',
  RealmMain = 'realm-main',
  Backup = 'backup',
}

export async function retrieveKey(service: KeyChainService) {
  try {
    const config = await RNFS.readFile(configFilePath)
    const configJson = JSON.parse(config)
    return (configJson.keys[service] as string) ?? undefined
  } catch (error) {
    logWarn(`error reading config file: ${error}`)
    return undefined
  }
}

export async function createAndStoreKey(service: KeyChainService, seed?: string) {
  const key = seed ? aes256KeyFromSeed(seed) : Key.generate(KeyAlgs.AesA256CbcHs512).secretBytes

  let configJson: { keys: Record<string, string> }
  try {
    const config = await RNFS.readFile(configFilePath)
    configJson = JSON.parse(config)
  } catch (error) {
    logWarn(`error reading config file: ${error}. Creating new config object`)
    configJson = { keys: {} }
  }

  configJson.keys[service] = TypedArrayEncoder.toHex(key)
  await RNFS.writeFile(configFilePath, JSON.stringify(configJson))

  return configJson.keys[service]
}

export async function deleteKey(service: KeyChainService) {
  try {
    const config = await RNFS.readFile(configFilePath)
    const configJson = JSON.parse(config)
    delete configJson.keys[service]
    await RNFS.writeFile(configFilePath, JSON.stringify(configJson))
    return configJson.keys
  } catch (error) {
    logWarn(`error deleting key ${service}: ${error}`)
    return undefined
  }
}

export async function deleteAllKeys() {
  try {
    const config = await RNFS.readFile(configFilePath)
    const configJson = JSON.parse(config)

    configJson.keys = {}
    await RNFS.writeFile(configFilePath, JSON.stringify(configJson))
  } catch (error) {
    logWarn(`error deleting keys: ${error}`)
  }
}

export function aes256KeyFromSeed(seed: string) {
  return Key.fromSeed({
    algorithm: KeyAlgs.AesA256CbcHs512,
    seed: TypedArrayEncoder.fromString(seed),
  }).secretBytes
}
