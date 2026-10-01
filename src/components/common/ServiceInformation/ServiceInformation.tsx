import ProofOfTrust from '@src/components/common/ProofOfTrust'
import { ServiceInfo, ServiceStatus } from '@src/model'
import React, { memo } from 'react'
import { View } from 'react-native'
import ServiceMainInfo from './ServiceMainInfo'

type Props = {
  initialServiceInfo: ServiceInfo
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
  onRetry?: () => void
}

const ServiceInformation = ({ initialServiceInfo, isFetchingInfo, serviceInfo, failedFetchInfo, onRetry }: Props) => {
  const serviceInfoToDisplay: ServiceInfo = !serviceInfo
    ? initialServiceInfo
    : serviceInfo.status === ServiceStatus.Trusted
      ? { ...serviceInfo, name: serviceInfo.name || initialServiceInfo.name }
      : {
          ...initialServiceInfo,
          status: serviceInfo.status,
          untrustedReason: serviceInfo.untrustedReason,
          network: serviceInfo.network,
          evaluatedAtTime: serviceInfo.evaluatedAtTime,
        }

  return (
    <View>
      <ServiceMainInfo
        serviceInfo={serviceInfoToDisplay}
        isFetchingInfo={isFetchingInfo}
        failedFetchInfo={failedFetchInfo}
        onRetry={onRetry}
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
