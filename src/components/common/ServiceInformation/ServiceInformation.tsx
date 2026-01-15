import React, { useEffect, memo } from 'react'
import { View } from 'react-native'

import ServiceMainInfo from './ServiceMainInfo'

import ProofOfTrust from '@2060/components/common/ProofOfTrust'
import { useFetchServiceInfo } from '@2060/hooks/useFetchServiceInfo'
import { ServiceInfo } from '@2060/model'

type Props = {
  did: string
  initialServiceInfo: ServiceInfo
  onServiceInfoUpdated?: (serviceInfo: ServiceInfo) => void
}

const ServiceInformation = ({ did, initialServiceInfo, onServiceInfoUpdated }: Props) => {
  const { isFetching, serviceInfo } = useFetchServiceInfo(did, true)
  const serviceInfoToDisplay = isFetching ? undefined : (serviceInfo ?? initialServiceInfo)

  useEffect(() => {
    if (serviceInfo) onServiceInfoUpdated?.(serviceInfo)
  }, [serviceInfo])

  return (
    <View>
      <ServiceMainInfo serviceInfo={serviceInfoToDisplay} />
      {serviceInfoToDisplay && <ProofOfTrust serviceInfo={serviceInfoToDisplay} />}
    </View>
  )
}

export default memo(ServiceInformation)
