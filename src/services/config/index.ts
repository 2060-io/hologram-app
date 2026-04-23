import { CONFIG_FILE_PATH, readFile, writeFile } from '@src/utils/RNFS'

export enum ParentalControlEnum {
  Enabled = 'enabled',
  KidBirthday = 'kid-birthday',
}

export const PARENTAL_CONTROL = 'parental-control'

export type ConfigJsonSignature = {
  keys: Record<string, string>
  [PARENTAL_CONTROL]: Record<string, string>
}

export async function storeKeyInConfigFile(key: ParentalControlEnum, value: string) {
  let configJson: ConfigJsonSignature
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    configJson = JSON.parse(config)
    if (!configJson[PARENTAL_CONTROL]) {
      configJson[PARENTAL_CONTROL] = {}
    }
  } catch {
    configJson = { keys: {}, [PARENTAL_CONTROL]: {} }
  }

  configJson[PARENTAL_CONTROL][key] = value
  await writeFile(CONFIG_FILE_PATH, JSON.stringify(configJson))

  return configJson[PARENTAL_CONTROL][key]
}

export async function retrieveKeyInConfigFile(key: ParentalControlEnum) {
  try {
    const config = await readFile(CONFIG_FILE_PATH)
    const configJson = JSON.parse(config)
    if (!configJson[PARENTAL_CONTROL]) return undefined
    return (configJson[PARENTAL_CONTROL][key] as string) ?? undefined
  } catch {
    return undefined
  }
}
