import {
  getStorageData,
  setStorageData,
  BACKGROUND_PUSH_NOTIFICATION_HANDLER_ENABLED_PERSIST_KEY,
  LOGS_ENABLED_PERSIST_KEY,
} from '@2060/services/localStorage'

export interface DevEnvsKeys {
  DATA_STORE_URL: string
  CLOUD_AGENT_PUBLIC_DID: string
  INDY_VDR_PROXY_BASE_URL: string
  WEBRTC_SERVER_BASE_URL: string
}

export type DevEnvsObject = Record<keyof DevEnvsKeys, string>
export type DevEnvObject = Partial<Record<keyof DevEnvsKeys, string>>

export type DevEnv = {
  key: keyof DevEnvsKeys
  values: string[]
}

export const devEnvPlaceholder: DevEnvsObject = {
  CLOUD_AGENT_PUBLIC_DID: 'Cloud Agent Public DID',
  DATA_STORE_URL: 'DataStore base URL',
  WEBRTC_SERVER_BASE_URL: 'WebRTC server base URL',
  INDY_VDR_PROXY_BASE_URL: 'Indy VDR Proxy base URL',
}

export const allDevEnvs: DevEnv[] = [
  {
    key: 'CLOUD_AGENT_PUBLIC_DID',
    values: ['did:web:ca.dev.2060.io', 'did:web:ca.2060.io'],
  },
  {
    key: 'DATA_STORE_URL',
    values: ['https://ds.dev.2060.io', 'https://ds.2060.io'],
  },
  {
    key: 'WEBRTC_SERVER_BASE_URL',
    values: ['https://webrtc.dev.2060.io', 'https://webrtc.2060.io'],
  },
  {
    key: 'INDY_VDR_PROXY_BASE_URL',
    values: ['https://indyvdrproxy.ca.dev.2060.io', 'https://indyvdrproxy.ca.2060.io'],
  },
]

export const isBackgroundNotificationHandlerEnabled = async () => {
  return (
    ((await getStorageData(BACKGROUND_PUSH_NOTIFICATION_HANDLER_ENABLED_PERSIST_KEY)) as boolean) ?? false
  )
}

export const savePushNotificationHandlerEnabled = async (newValue: boolean) => {
  await setStorageData(BACKGROUND_PUSH_NOTIFICATION_HANDLER_ENABLED_PERSIST_KEY, newValue)
}

export const areLogsEnabled = async () => {
  return ((await getStorageData(LOGS_ENABLED_PERSIST_KEY)) as boolean) ?? false
}

export const saveLogsEnabled = async (newValue: boolean) => {
  await setStorageData(LOGS_ENABLED_PERSIST_KEY, newValue)
}
