import { readFile } from 'react-native-fs'

import { CONFIG_FILE_PATH } from '@2060/constants'
import { logError } from '@2060/utils'
import { writeFile } from '@2060/utils/RNFS'

export enum ParentalControlEnum {
  Enabled = 'enabled',
  KidBirthday = 'kid-birthday',
}

export async function storeValueInConfigFile(key: ParentalControlEnum, value: string) {
  let configJson: { keys: Record<string, string> }
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    configJson = JSON.parse(config)
  } catch (error) {
    logError(`error reading config file: ${error}. Creating new config object`)
    configJson = { keys: {} }
  }

  configJson.keys[key] = value
  await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))

  return configJson.keys[key]
}
