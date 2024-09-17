import React, { useEffect, memo } from 'react'
import { View } from 'react-native'

import ServiceMainInfo from './ServiceMainInfo'

import ProofOfTrust from '@2060/components/common/ProofOfTrust'
import { useFetchServiceInfo } from '@2060/hooks'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'

type Props = {
  did: string
  serviceInfoRef: React.MutableRefObject<ServiceInfo>
}

const getServiceInfoToDisplay = ({
  serviceInfo,
  serviceInfoRef,
  isFetching,
}: {
  serviceInfo: ServiceInfo | undefined
  serviceInfoRef: React.MutableRefObject<ServiceInfo>
  isFetching: boolean
}): ServiceInfo | undefined => {
  if (serviceInfo) return serviceInfo
  if (isFetching) return undefined
  return serviceInfoRef.current
}

const ServiceInformation = ({ did, serviceInfoRef }: Props) => {
  const { isFetching, serviceInfo } = useFetchServiceInfo(did, true)
  const serviceInfoToDisplay = getServiceInfoToDisplay({ serviceInfo, serviceInfoRef, isFetching })

  useEffect(() => {
    if (serviceInfo) serviceInfoRef.current = serviceInfo
  }, [serviceInfo])

  return serviceInfoToDisplay ? (
    <View>
      <ServiceMainInfo serviceInfo={serviceInfoToDisplay} />
      <ProofOfTrust serviceInfo={serviceInfoToDisplay} />
    </View>
  ) : null
}

export default memo(ServiceInformation)
