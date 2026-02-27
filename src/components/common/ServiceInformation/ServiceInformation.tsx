import React, { memo } from 'react'
import { View } from 'react-native'

import ServiceMainInfo from './ServiceMainInfo'

import ProofOfTrust from '@src/components/common/ProofOfTrust'
import { ServiceInfo } from '@src/model'

type Props = {
  initialServiceInfo: ServiceInfo
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
}

const ServiceInformation = ({ initialServiceInfo, isFetchingInfo, serviceInfo, failedFetchInfo }: Props) => {
  const serviceInfoToDisplay = serviceInfo ?? initialServiceInfo

  return (
    <View>
      <ServiceMainInfo
        serviceInfo={serviceInfoToDisplay}
        isFetchingInfo={isFetchingInfo}
        failedFetchInfo={failedFetchInfo}
      />
      <ProofOfTrust
        serviceInfo={serviceInfoToDisplay}
        isFetchingInfo={isFetchingInfo}
        failedFetchInfo={failedFetchInfo}
      />
    </View>
  )
}

export default memo(ServiceInformation)
