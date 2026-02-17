import {
  getStorageData,
  setStorageData,
  LOGS_ENABLED_PERSIST_KEY,
  DEVELOPER_MODE_ENABLED_PERSIST_KEY,
} from '@src/services/localStorage'

export interface DevEnvsKeys {
  S3_SERVER_URL: string
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
  S3_SERVER_URL: 'S3 server URL',
  WEBRTC_SERVER_BASE_URL: 'WebRTC server base URL',
  INDY_VDR_PROXY_BASE_URL: 'Indy VDR Proxy base URL',
}

export const allDevEnvs: DevEnv[] = [
  {
    key: 'CLOUD_AGENT_PUBLIC_DID',
    values: ['did:web:ca.dev.2060.io', 'did:web:ca.2060.io'],
  },
  {
    key: 'S3_SERVER_URL',
    values: ['https://s3.minio.dev.2060.io', 'https://s3.minio.2060.io'],
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

export const areLogsEnabled = async () => {
  return Boolean(await getStorageData(LOGS_ENABLED_PERSIST_KEY))
}

export const saveLogsEnabled = async (newValue: boolean) => {
  await setStorageData(LOGS_ENABLED_PERSIST_KEY, newValue)
}

export const getIsDeveloperMode = async () => {
  return Boolean(await getStorageData(DEVELOPER_MODE_ENABLED_PERSIST_KEY))
}
