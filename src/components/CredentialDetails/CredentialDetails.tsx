import React from 'react'
import { View } from 'react-native'

import CredentialAttributes from '../CredentialAttributes'

import styles from './styles'

import { DumbCredentialMainInformation } from '@src/components/common'
import { ServiceInfo } from '@src/model'
import { CredentialDetailsForDisplay } from '@src/services/agent/display'

type Props = {
  credentialDetails: CredentialDetailsForDisplay
  middleInfo?: React.JSX.Element
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
  withLoadingSkeleton: boolean
}

const CredentialDetails = ({
  credentialDetails,
  middleInfo,
  isFetchingInfo,
  serviceInfo,
  failedFetchInfo,
  withLoadingSkeleton,
}: Props) => {
  return (
    <View style={styles.container}>
      <DumbCredentialMainInformation
        credentialMainInfo={credentialDetails.mainInfo}
        containerStyle={styles.credentialMainInfoContainer}
        isFetchingInfo={isFetchingInfo && withLoadingSkeleton}
        serviceInfo={serviceInfo}
        failedFetchInfo={failedFetchInfo}
      />
      {middleInfo}
      <CredentialAttributes attributes={credentialDetails.attributes} />
    </View>
  )
}

export default CredentialDetails
