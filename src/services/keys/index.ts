import { TypedArrayEncoder } from '@credo-ts/core'
import { Key, KeyAlgs } from '@hyperledger/aries-askar-react-native'
import { readFile, DocumentDirectoryPath } from 'react-native-fs'

import { logError } from '@2060/utils'
import { writeFile } from '@2060/utils/RNFS'

export const configFilePath = `${DocumentDirectoryPath}/config.json`

export enum ParentalControlEnum {
  Enabled = 'enabled',
  KidBirthday = 'kid-birthday',
}

export enum KeyChainService {
  AfjWallet = 'afj-wallet',
  RealmMain = 'realm-main',
  Backup = 'backup',
  ParentalControlPIN = 'parental-control-pin',
}

export async function retrieveKey(service: KeyChainService | ParentalControlEnum) {
  try {
    const config = await readFile(configFilePath)
    const configJson = JSON.parse(config)
    return (configJson.keys[service] as string) ?? undefined
  } catch (error) {
    logError(`error reading config file: ${error}`)
    return undefined
  }
}

export async function createAndStoreKeyWithoutHash(key: ParentalControlEnum, value: string) {
  let configJson: { keys: Record<string, string> }
  try {
    const config = await readFile(configFilePath)
    configJson = JSON.parse(config)
  } catch (error) {
    logError(`error reading config file: ${error}. Creating new config object`)
    configJson = { keys: {} }
  }

  configJson.keys[key] = value
  await writeFile(configFilePath, JSON.stringify(configJson))

  return configJson.keys[key]
}

export async function createAndStoreKey(service: KeyChainService, seed?: string) {
  const key = seed ? aes256KeyFromSeed(seed) : Key.generate(KeyAlgs.AesA256CbcHs512).secretBytes

  let configJson: { keys: Record<string, string> }
  try {
    const config = await readFile(configFilePath)
    configJson = JSON.parse(config)
  } catch (error) {
    logError(`error reading config file: ${error}. Creating new config object`)
    configJson = { keys: {} }
  }

  configJson.keys[service] = TypedArrayEncoder.toHex(key)
  await writeFile(configFilePath, JSON.stringify(configJson))

  return configJson.keys[service]
}

export async function deleteKey(service: KeyChainService) {
  try {
    const config = await readFile(configFilePath)
    const configJson = JSON.parse(config)
    delete configJson.keys[service]
    await writeFile(configFilePath, JSON.stringify(configJson))
    return configJson.keys
  } catch (error) {
    logError(`error deleting key ${service}: ${error}`)
    return undefined
  }
}

export async function deleteAllKeys() {
  try {
    const config = await readFile(configFilePath)
    const configJson = JSON.parse(config)

    configJson.keys = {}
    await writeFile(configFilePath, JSON.stringify(configJson))
  } catch (error) {
    logError(`error deleting keys: ${error}`)
  }
}

export function aes256KeyFromSeed(seed: string) {
  return Key.fromSeed({
    algorithm: KeyAlgs.AesA256CbcHs512,
    seed: TypedArrayEncoder.fromString(seed),
  }).secretBytes
}
