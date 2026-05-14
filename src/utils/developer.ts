import {
  DEVELOPER_MODE_ENABLED_PERSIST_KEY,
  getStorageData,
  LOGS_ENABLED_PERSIST_KEY,
  setStorageData,
} from '@src/services/localStorage'

export interface DevEnvsKeys {
  S3_SERVER_URL: string
  MEDIATOR_PUBLIC_DID: string
  INDY_VDR_PROXY_BASE_URL: string
  WEBRTC_SERVER_BASE_URL: string
  SUPPORTED_DIDCOMM_VERSIONS: string
}

export type DidCommVersion = 'v1' | 'v2'

export const ALL_DIDCOMM_VERSIONS: DidCommVersion[] = ['v1', 'v2']

export const parseDidcommVersions = (value: string | undefined | null): DidCommVersion[] => {
  const parsed = (value ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter((v): v is DidCommVersion => v === 'v1' || v === 'v2')
  const deduped = ALL_DIDCOMM_VERSIONS.filter((v) => parsed.includes(v))
  return deduped.length > 0 ? deduped : ['v1']
}

export type DevEnvsObject = Record<keyof DevEnvsKeys, string>
export type DevEnvObject = Partial<Record<keyof DevEnvsKeys, string>>

export type DevEnv = {
  key: keyof DevEnvsKeys
  values: string[]
}

export const devEnvPlaceholder: DevEnvsObject = {
  MEDIATOR_PUBLIC_DID: 'Mediator Public DID',
  S3_SERVER_URL: 'S3 server URL',
  WEBRTC_SERVER_BASE_URL: 'WebRTC server base URL',
  INDY_VDR_PROXY_BASE_URL: 'Indy VDR Proxy base URL',
  SUPPORTED_DIDCOMM_VERSIONS: 'Supported DIDComm versions',
}

export const isMultiSelectDevEnv = (key: keyof DevEnvsKeys) => key === 'SUPPORTED_DIDCOMM_VERSIONS'

export const allDevEnvs: DevEnv[] = [
  {
    key: 'MEDIATOR_PUBLIC_DID',
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
  {
    key: 'SUPPORTED_DIDCOMM_VERSIONS',
    values: ALL_DIDCOMM_VERSIONS,
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
