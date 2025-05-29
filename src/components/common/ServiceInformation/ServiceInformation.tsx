import React, { useEffect, memo } from 'react'
import { View } from 'react-native'

import ServiceMainInfo from './ServiceMainInfo'

import ProofOfTrust from '@2060/components/common/ProofOfTrust'
import { useFetchServiceInfo } from '@2060/hooks/useFetchServiceInfo'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'

type Props = {
  did: string
  initialServiceInfo: ServiceInfo
  onServiceInfoUpdated?: (serviceInfo: ServiceInfo) => void
}

const getServiceInfoToDisplay = ({
  serviceInfo,
  initialServiceInfo,
  isFetching,
}: {
  serviceInfo: ServiceInfo | undefined
  initialServiceInfo: ServiceInfo
  isFetching: boolean
}): ServiceInfo | undefined => {
  if (serviceInfo) return serviceInfo
  if (isFetching) return undefined
  return initialServiceInfo
}

const ServiceInformation = ({ did, initialServiceInfo, onServiceInfoUpdated }: Props) => {
  const { isFetching, serviceInfo } = useFetchServiceInfo(did, true)
  const serviceInfoToDisplay = getServiceInfoToDisplay({ serviceInfo, initialServiceInfo, isFetching })

  useEffect(() => {
    if (serviceInfo) onServiceInfoUpdated?.(serviceInfo)
  }, [serviceInfo])

  return serviceInfoToDisplay ? (
    <View>
      <ServiceMainInfo serviceInfo={serviceInfoToDisplay} />
      <ProofOfTrust serviceInfo={serviceInfoToDisplay} />
    </View>
  ) : null
}

export default memo(ServiceInformation)
