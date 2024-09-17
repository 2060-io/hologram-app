import AsyncStorage from '@react-native-community/async-storage'

import { logError } from './log'

export const setStorageData = async (key: string, value: unknown) => {
  try {
    const jsonValue = JSON.stringify(value)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (error) {
    logError(JSON.stringify(error))
  }
}

export const getStorageData = async (key: string): Promise<unknown | null | undefined> => {
  try {
    const value = await AsyncStorage.getItem(key)
    if (value) return JSON.parse(value)

    return null
  } catch (error) {
    logError(JSON.stringify(error))
  }
}
