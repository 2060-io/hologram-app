import ProofOfTrustCard from '@src/components/common/ProofOfTrustCard'
import { ServiceInfo } from '@src/model'
import React, { memo, ReactNode } from 'react'

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
}: Props) => (
  <ProofOfTrustCard
    serviceInfo={serviceInfo ?? initialServiceInfo}
    isFetchingInfo={isFetchingInfo}
    failedFetchInfo={failedFetchInfo}
    onRetry={onRetry}
    ask={ask}
    declaredName={initialServiceInfo.name}
    declaredLogoUrl={initialServiceInfo.logoUrl}
  />
)

export default memo(ServiceInformation)
