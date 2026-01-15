import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import CanNotConnect from './CanNotConnect'

import { ServiceInformation } from '@2060/components/common'
import { useValidateKidAgeRestrictions } from '@2060/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo, ServiceStatus } from '@2060/model'

type Props = {
  did: string
  initialServiceInfo: ServiceInfo
  setAgeRestricted(canConnect: boolean): void
  userName: string | undefined
}

const PublicService = ({ did, initialServiceInfo, setAgeRestricted, userName }: Props) => {
  const [minimumAgeRequired, setMinimumAgeRequired] = useState(initialServiceInfo.minimumAgeRequired)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(initialServiceInfo.status)
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ minimumAgeRequired, serviceStatus })

  useEffect(() => {
    setAgeRestricted(ageRestricted)
  }, [ageRestricted])

  return (
    <View>
      {ageRestricted && <CanNotConnect kidAge={kidAge} userName={userName} />}
      <ServiceInformation
        did={did}
        onServiceInfoUpdated={serviceInfo => {
          setMinimumAgeRequired(serviceInfo.minimumAgeRequired)
          setServiceStatus(serviceInfo.status)
        }}
      />
    </View>
  )
}

export default PublicService
