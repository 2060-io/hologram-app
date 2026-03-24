declare module 'react-native-config' {
  export interface NativeConfig {
    APP_NAME: string
    BASE_INVITATION_URL: string
    S3_SERVER_URL: string
    CLOUD_AGENT_PUBLIC_DID: string
    DEFAULT_SERVICE_PUBLIC_DID: string
    DEFAULT_SERVICE_ALIAS: string
    INDY_VDR_PROXY_BASE_URL: string
    BACKUP_NAME: string
    APP_CHECK_DEBUG_MODE: boolean
    WEBRTC_SERVER_BASE_URL: string
    IOS_FIREBASE_DEBUG_TOKEN: string
    ANDROID_FIREBASE_DEBUG_TOKEN: string
  }

  export const Config: NativeConfig
  export default Config
}
