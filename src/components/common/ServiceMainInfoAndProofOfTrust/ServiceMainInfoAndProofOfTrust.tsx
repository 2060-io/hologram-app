import React, { memo } from 'react'
import { View } from 'react-native'

import ProofOfTrust from '../ProofOfTrust'
import ServiceMainInfo from '../ServiceMainInfo'

import { ServiceInfo } from '@src/model'

type Props = {
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
  withLoadingSkeleton: boolean
}

const ServiceMainInfoAndProofOfTrust = ({
  isFetchingInfo,
  serviceInfo,
  failedFetchInfo,
  withLoadingSkeleton,
}: Props) => {
  return (
    <View>
      <ServiceMainInfo
        serviceInfo={serviceInfo}
        isFetchingInfo={isFetchingInfo}
        failedFetchInfo={failedFetchInfo}
        withLoadingSkeleton={withLoadingSkeleton}
      />
      <ProofOfTrust serviceInfo={serviceInfo} isFetchingInfo={isFetchingInfo} />
    </View>
  )
}

export default memo(ServiceMainInfoAndProofOfTrust)
