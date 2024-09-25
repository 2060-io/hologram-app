declare module 'react-native-config' {
  export interface NativeConfig {
    BASE_INVITATION_URL: string
    DATA_STORE_URL: string
    CLOUD_AGENT_PUBLIC_DID: string
    TRUSTED_SERVICE_RESOLVER_BASE_URL: string
    DEFAULT_SERVICE_PUBLIC_DID: string
    DEFAULT_SERVICE_ALIAS: string
    INDY_VDR_PROXY_BASE_URL: string
    BACKUP_NAME: string
    APP_CHECK_DEBUG_MODE: boolean
    WEBRTC_SERVER_BASE_URL: string
  }

  export const Config: NativeConfig
  export default Config
}
