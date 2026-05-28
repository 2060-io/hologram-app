import { ServiceInfo } from '@src/model'
import { CredentialMainInfo } from '@src/services/agent/display'
import { StyleProp, ViewStyle } from 'react-native'

export type CredentialMainInformationProps = {
  credentialMainInfo: CredentialMainInfo | null
  containerStyle?: StyleProp<ViewStyle>
  onPress?: () => void
  size?: 'big' | 'medium'
}

export type DumbCredentialMainInformationProps = CredentialMainInformationProps & {
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
}
