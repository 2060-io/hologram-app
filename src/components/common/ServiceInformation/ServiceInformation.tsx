import VeranaTrustCard, { VeranaTrustAsk } from '@src/components/common/VeranaTrustCard'
import { ServiceInfo } from '@src/model'
import { veranaTrustStatusOf } from '@src/services/verana'
import React, { memo } from 'react'
import { View } from 'react-native'
import ServiceMainInfo from './ServiceMainInfo'

type Props = {
  initialServiceInfo: ServiceInfo
  isFetchingInfo: boolean
  serviceInfo: ServiceInfo | undefined
  failedFetchInfo: boolean
  ask?: VeranaTrustAsk
}

const ServiceInformation = ({ initialServiceInfo, isFetchingInfo, serviceInfo, failedFetchInfo, ask }: Props) => {
  const serviceInfoToDisplay = serviceInfo ?? initialServiceInfo

  return (
    <View>
      <ServiceMainInfo
        serviceInfo={serviceInfoToDisplay}
        isFetchingInfo={isFetchingInfo}
        failedFetchInfo={failedFetchInfo}
      />
      <VeranaTrustCard
        did={serviceInfoToDisplay.did}
        serviceInfo={serviceInfo}
        trustStatus={veranaTrustStatusOf(serviceInfo, failedFetchInfo)}
        isFetchingInfo={isFetchingInfo}
        ask={ask}
      />
    </View>
  )
}

export default memo(ServiceInformation)
