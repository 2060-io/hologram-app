import { DidCommOutOfBandInvitation } from '@credo-ts/didcomm'
import { TrustResolutionOutcome } from 'node_modules/@verana-labs/verre/build/types'
import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import CanNotConnect from './CanNotConnect'

import { ServiceInformation } from '@src/components/common'
import { useFetchServiceInfo } from '@src/hooks/useFetchServiceInfo'
import { useValidateKidAgeRestrictions } from '@src/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo, ServiceStatus } from '@src/model'

type Props = {
  did: string
  invitation: DidCommOutOfBandInvitation
  setAgeRestricted(canConnect: boolean): void
  userName: string | undefined
}

const PublicService = ({ did, invitation, setAgeRestricted, userName }: Props) => {
  const { isFetchingInfo, serviceInfo, failedFetchInfo } = useFetchServiceInfo(did)
  const initialServiceInfo = useRef<ServiceInfo>({
    did,
    description: invitation.label,
    id: invitation.id,
    logoUrl: invitation.imageUrl,
    name: invitation.label ?? '',
    minimumAgeRequired: 0,
    status: TrustResolutionOutcome.INVALID,
  }).current
  const [minimumAgeRequired, setMinimumAgeRequired] = useState(initialServiceInfo.minimumAgeRequired)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(initialServiceInfo.status)
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus })

  useEffect(() => {
    if (serviceInfo) {
      setMinimumAgeRequired(serviceInfo.minimumAgeRequired)
      setServiceStatus(serviceInfo.status)
    }
  }, [serviceInfo])

  useEffect(() => {
    setAgeRestricted(ageRestricted)
  }, [ageRestricted])

  return (
    <View>
      {ageRestricted && <CanNotConnect kidAge={kidAge} userName={userName} />}
      <ServiceInformation
        initialServiceInfo={initialServiceInfo}
        isFetchingInfo={isFetchingInfo}
        serviceInfo={serviceInfo}
        failedFetchInfo={failedFetchInfo}
      />
    </View>
  )
}

export default PublicService
