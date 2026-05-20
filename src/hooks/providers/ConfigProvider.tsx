import {
  CUSTOM_DEV_ENVS_PERSIST_KEY,
  DEV_ENVS_PERSIST_KEY,
  DEVELOPER_MODE_ENABLED_PERSIST_KEY,
  getStorageData,
  setStorageData,
} from '@src/services/localStorage'
import { DevEnvObject, DevEnvsObject, getIsDeveloperMode } from '@src/utils/developer'
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import Config from 'react-native-config'

const defaultDevEnvs: DevEnvsObject = {
  MEDIATOR_PUBLIC_DID: Config.MEDIATOR_PUBLIC_DID as string,
  S3_SERVER_URL: Config.S3_SERVER_URL as string,
  WEBRTC_SERVER_BASE_URL: Config.WEBRTC_SERVER_BASE_URL as string,
  INDY_VDR_PROXY_BASE_URL: Config.INDY_VDR_PROXY_BASE_URL as string,
  SUPPORTED_DIDCOMM_VERSIONS: (Config.SUPPORTED_DIDCOMM_VERSIONS as string) ?? 'v1',
}

const restoreMissingDevEnvs = (
  persistedDevEnvs: DevEnvsObject
): { devEnvs: DevEnvsObject; needsToRestore: boolean } => {
  const areMissingPersistedDevEnvs = Object.keys(defaultDevEnvs).some((key) => !(key in persistedDevEnvs))
  if (!areMissingPersistedDevEnvs) return { devEnvs: persistedDevEnvs, needsToRestore: false }
  const newPersistedDevEnvs: DevEnvsObject = { ...persistedDevEnvs }
  Object.keys(defaultDevEnvs).forEach((key) => {
    const thisKeyIsNotInPersistedEnvs = !(key in persistedDevEnvs)
    if (thisKeyIsNotInPersistedEnvs) {
      newPersistedDevEnvs[key as keyof DevEnvsObject] = defaultDevEnvs[key as keyof DevEnvsObject]
    }
  })
  return { devEnvs: newPersistedDevEnvs, needsToRestore: true }
}

type ConfigProps = {
  devEnvs: DevEnvsObject
  updateDevEnvs(newDevEnvs: DevEnvsObject): Promise<void>
  saveCustomDevEnv(newCustomDevEnvValue: DevEnvObject): Promise<void>
  storedCustomDevEnvs: DevEnvObject | undefined
  isDeveloperMode: boolean
  changeDeveloperModeStatus(): Promise<void>
}

export const useConfig = () => {
  const configContext = useContext(ConfigContext)
  if (!configContext) throw new Error('useConfig must be used within a ConfigProvider')
  return configContext
}

const ConfigContext = createContext<ConfigProps | undefined>(undefined)

export const ConfigProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [devEnvs, setDevEnvs] = useState<DevEnvsObject>(defaultDevEnvs)
  const [storedCustomDevEnvs, setStoredCustomDevEnvs] = useState<DevEnvObject>()
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)

  useEffect(() => {
    const setupDeveloperMode = async () => {
      const persistedDeveloperMode = await getIsDeveloperMode()
      if (persistedDeveloperMode) setIsDeveloperMode(persistedDeveloperMode)
    }
    setupDeveloperMode()
  }, [])

  useEffect(() => {
    const setupDevEnvs = async () => {
      const persistedDevEnvs = (await getStorageData(DEV_ENVS_PERSIST_KEY)) as DevEnvsObject
      if (persistedDevEnvs) {
        const { devEnvs: newDevEnvs, needsToRestore } = restoreMissingDevEnvs(persistedDevEnvs)
        setDevEnvs(newDevEnvs)
        if (needsToRestore) await setStorageData(DEV_ENVS_PERSIST_KEY, newDevEnvs)
      } else {
        await setStorageData(DEV_ENVS_PERSIST_KEY, defaultDevEnvs)
      }
    }
    const setupCustomDevEnvs = async () => {
      const persistedCustomDevEnvs = (await getStorageData(CUSTOM_DEV_ENVS_PERSIST_KEY)) as DevEnvsObject
      if (persistedCustomDevEnvs) {
        setStoredCustomDevEnvs(persistedCustomDevEnvs)
      }
    }
    setupDevEnvs()
    setupCustomDevEnvs()
  }, [])

  const changeDeveloperModeStatus = useCallback(async () => {
    const newIsDeveloperMode = !isDeveloperMode
    setIsDeveloperMode(newIsDeveloperMode)
    await setStorageData(DEVELOPER_MODE_ENABLED_PERSIST_KEY, newIsDeveloperMode)
  }, [isDeveloperMode])

  const updateDevEnvs = async (newDevEnvs: DevEnvsObject) => {
    await setStorageData(DEV_ENVS_PERSIST_KEY, newDevEnvs)
    setDevEnvs(newDevEnvs)
  }

  const saveCustomDevEnv = async (newCustomDevEnvValue: DevEnvObject) => {
    const newCustomDevEnvValues = storedCustomDevEnvs
      ? {
          ...storedCustomDevEnvs,
          ...newCustomDevEnvValue,
        }
      : newCustomDevEnvValue
    await setStorageData(CUSTOM_DEV_ENVS_PERSIST_KEY, newCustomDevEnvValues)
    setStoredCustomDevEnvs(newCustomDevEnvValues)
    const newDevEnvsToPersist = { ...devEnvs, ...newCustomDevEnvValue }
    await updateDevEnvs(newDevEnvsToPersist)
  }

  return (
    <ConfigContext
      value={{
        devEnvs,
        updateDevEnvs,
        storedCustomDevEnvs,
        saveCustomDevEnv,
        isDeveloperMode,
        changeDeveloperModeStatus,
      }}
    >
      {children}
    </ConfigContext>
  )
}
