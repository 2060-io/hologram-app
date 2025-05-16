import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import CanNotConnect from './CanNotConnect'

import { ServiceInformation } from '@2060/components/common'
import { useValidateKidAgeRestrictions } from '@2060/hooks/useValidateKidAgeRestrictions'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'

type Props = {
  did: string
  initialServiceInfo: ServiceInfo
  setAgeRestricted(canConnect: boolean): void
  userName: string | undefined
}

const PublicService = ({ did, initialServiceInfo, setAgeRestricted, userName }: Props) => {
  const [serviceMinimumAgeRequired, setServiceMinimumAgeRequired] = useState(0)
  const { kidAge, ageRestricted } = useValidateKidAgeRestrictions({ serviceMinimumAgeRequired })

  useEffect(() => {
    setAgeRestricted(ageRestricted)
  }, [ageRestricted])

  return (
    <View>
      {ageRestricted && <CanNotConnect kidAge={kidAge} userName={userName} />}
      <ServiceInformation
        did={did}
        initialServiceInfo={initialServiceInfo}
        onServiceInfoUpdated={({ minimumAgeRequired }) => setServiceMinimumAgeRequired(minimumAgeRequired)}
      />
    </View>
  )
}

export default PublicService
