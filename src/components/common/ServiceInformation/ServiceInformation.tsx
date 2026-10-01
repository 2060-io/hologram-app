import ProofOfTrustCard from '@src/components/common/ProofOfTrustCard'
import { ServiceInfo, ServiceStatus } from '@src/model'
import React, { memo, ReactNode } from 'react'
import { View } from 'react-native'
import ServiceMainInfo from './ServiceMainInfo'

type Props = {
  initialServiceInfo: ServiceInfo
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
  onRetry?: () => void
  ask?: ReactNode
}

const ServiceInformation = ({
  initialServiceInfo,
  isFetchingInfo,
  serviceInfo,
  failedFetchInfo,
  onRetry,
  ask,
}: Props) => {
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
      <ProofOfTrustCard
        serviceInfo={serviceInfo ?? initialServiceInfo}
        isFetchingInfo={isFetchingInfo}
        failedFetchInfo={failedFetchInfo}
        onRetry={onRetry}
        ask={ask}
      />
    </View>
  )
}

export default memo(ServiceInformation)
