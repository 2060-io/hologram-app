import React, { useEffect, memo } from 'react'
import { View } from 'react-native'

import ServiceMainInfo from './ServiceMainInfo'

import ProofOfTrust from '@2060/components/common/ProofOfTrust'
import { useFetchServiceInfo } from '@2060/hooks/useFetchServiceInfo'
import { ServiceInfo } from '@2060/model'

type Props = {
  did: string
  onServiceInfoUpdated?: (serviceInfo: ServiceInfo) => void
}

const ServiceInformation = ({ did, onServiceInfoUpdated }: Props) => {
  const { serviceInfo } = useFetchServiceInfo(did, true)

  useEffect(() => {
    if (serviceInfo) onServiceInfoUpdated?.(serviceInfo)
  }, [serviceInfo])

  return (
    <View>
      <ServiceMainInfo serviceInfo={serviceInfo} />
      {serviceInfo && <ProofOfTrust serviceInfo={serviceInfo} />}
    </View>
  )
}

export default memo(ServiceInformation)
