import React, { useEffect, memo } from 'react'
import { View } from 'react-native'

import ServiceMainInfo from './ServiceMainInfo'

import ProofOfTrust from '@src/components/common/ProofOfTrust'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { ServiceInfo } from '@src/model'

type Props = {
  did: string
  initialServiceInfo: ServiceInfo
  onServiceInfoUpdated?: (serviceInfo: ServiceInfo) => void
}

const ServiceInformation = ({ did, initialServiceInfo, onServiceInfoUpdated }: Props) => {
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo(did)
  const serviceInfoToDisplay = serviceInfo ?? initialServiceInfo

  useEffect(() => {
    if (serviceInfo) onServiceInfoUpdated?.(serviceInfo)
  }, [serviceInfo])

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
