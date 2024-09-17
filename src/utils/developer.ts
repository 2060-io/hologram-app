export interface DevEnvsKeys {
  DATA_STORE_URL: string
  CLOUD_AGENT_PUBLIC_DID: string
  TRUSTED_SERVICE_RESOLVER_BASE_URL: string
  INDY_VDR_PROXY_BASE_URL: string
  WEBRTC_SERVER_HOST: string
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
  TRUSTED_SERVICE_RESOLVER_BASE_URL: 'Trusted Service Resolver base URL',
  WEBRTC_SERVER_HOST: 'WebRTC server host',
  INDY_VDR_PROXY_BASE_URL: 'Indy VDR Proxy base URL',
}

export const allDevEnvs: DevEnv[] = [
  {
    key: 'CLOUD_AGENT_PUBLIC_DID',
    values: ['did:web:ca.dev.2060.io', 'did:web:ca.st.2060.io', 'did:web:ca.2060.io'],
  },
  {
    key: 'DATA_STORE_URL',
    values: ['https://ds.dev.2060.io', 'https://ds.st.2060.io', 'https://ds.2060.io'],
  },
  {
    key: 'TRUSTED_SERVICE_RESOLVER_BASE_URL',
    values: ['https://tsr.dev.2060.io', 'https://tsr.st.2060.io', 'https://tsr.2060.io'],
  },
  {
    key: 'WEBRTC_SERVER_HOST',
    values: ['webrtc.dev.2060.io', 'webrtc.st.2060.io', 'webrtc.2060.io'],
  },
  {
    key: 'INDY_VDR_PROXY_BASE_URL',
    values: [
      'https://indyvdrproxy.ca.dev.2060.io',
      'https://indyvdrproxy.ca.st.2060.io',
      'https://indyvdrproxy.ca.2060.io',
    ],
  },
]
