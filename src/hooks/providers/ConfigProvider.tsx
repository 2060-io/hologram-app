import React, { useContext, createContext, PropsWithChildren, useState, useEffect, useCallback } from 'react'
import Config from 'react-native-config'

import {
  CUSTOM_DEV_ENVS_PERSIST_KEY,
  DEV_ENVS_PERSIST_KEY,
  getStorageData,
  DEVELOPER_MODE_ENABLED_PERSIST_KEY,
  setStorageData,
} from '@2060/services/localStorage'
import { DevEnvsObject, DevEnvObject, getIsDeveloperMode } from '@2060/utils/developer'

const defaultDevEnvs: DevEnvsObject = {
  CLOUD_AGENT_PUBLIC_DID: Config.CLOUD_AGENT_PUBLIC_DID as string,
  DATA_STORE_URL: Config.DATA_STORE_URL as string,
  WEBRTC_SERVER_BASE_URL: Config.WEBRTC_SERVER_BASE_URL as string,
  INDY_VDR_PROXY_BASE_URL: Config.INDY_VDR_PROXY_BASE_URL as string,
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
      const persistedDevEnvs = await getStorageData(DEV_ENVS_PERSIST_KEY)
      if (persistedDevEnvs) {
        setDevEnvs(persistedDevEnvs as DevEnvsObject)
      } else {
        await setStorageData(DEV_ENVS_PERSIST_KEY, defaultDevEnvs)
      }
    }
    const setupCustomDevEnvs = async () => {
      const persistedCustomDevEnvs = await getStorageData(CUSTOM_DEV_ENVS_PERSIST_KEY)
      if (persistedCustomDevEnvs) {
        setStoredCustomDevEnvs(persistedCustomDevEnvs as DevEnvsObject)
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
