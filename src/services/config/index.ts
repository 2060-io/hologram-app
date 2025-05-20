import { readFile } from 'react-native-fs'

import { CONFIG_FILE_PATH } from '@2060/constants'
import { logError } from '@2060/utils'
import { writeFile } from '@2060/utils/RNFS'

export enum ParentalControlEnum {
  Enabled = 'enabled',
  KidBirthday = 'kid-birthday',
}

export async function storeKeyInConfigFile(key: ParentalControlEnum, value: string) {
  let configJson: Record<string, string>
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    configJson = JSON.parse(config)
  } catch (error) {
    logError(`error reading config file: ${error}. Creating new config object`)
    configJson = {}
  }

  configJson[key] = value
  await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))

  return configJson[key]
}

export async function retrieveKeyInConfigFile(key: ParentalControlEnum) {
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    const configJson = JSON.parse(config)
    return (configJson[key] as string) ?? undefined
  } catch (error) {
    logError(`error reading config file: ${error}`)
    return undefined
  }
}

export async function deleteKeyInConfigFile(key: ParentalControlEnum) {
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    const configJson = JSON.parse(config)
    delete configJson[key]
    await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))
    return configJson
  } catch (error) {
    logError(`error deleting key ${key}: ${error}`)
    return undefined
  }
}
