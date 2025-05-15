import dayjs from 'dayjs'
import React, { useState } from 'react'
import { View } from 'react-native'

import CanNotConnect from './CanNotConnect'

import { ServiceInformation } from '@2060/components/common'
import { KID_BIRTHDATE_DATE_FORMAT } from '@2060/constants'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'
import { ParentalControlEnum, retrieveKey } from '@2060/services/keys'
import { timeFromNow } from '@2060/utils/dateUtils'

type Props = {
  did: string
  serviceInfoRef: React.MutableRefObject<ServiceInfo>
  canConnect: boolean
  setCanConnect(canConnect: boolean): void
}

const calculateAge = (kidBirthday: string) => {
  return timeFromNow(kidBirthday)
}

const PublicService = ({ did, serviceInfoRef, canConnect, setCanConnect }: Props) => {
  const [kidAge, setKidAge] = useState(0)

  const checkIfValidateKidAge = async (serviceInfo: ServiceInfo) => {
    if (serviceInfo.minimumAgeRequired <= 0) return
    const isParentalControlEnabled = await retrieveKey(ParentalControlEnum.Enabled)
    if (isParentalControlEnabled === 'true') validateKidCanConnect(serviceInfo)
  }

  const validateKidCanConnect = async (serviceInfo: ServiceInfo) => {
    const kidBirthday =
      (await retrieveKey(ParentalControlEnum.KidBirthday)) ??
      dayjs(new Date()).format(KID_BIRTHDATE_DATE_FORMAT)
    const age = calculateAge(kidBirthday)
    if (age < serviceInfo.minimumAgeRequired) {
      setKidAge(age)
      setCanConnect(false)
    }
  }

  return (
    <View>
      {!canConnect && <CanNotConnect kidAge={kidAge} />}
      <ServiceInformation
        did={did}
        serviceInfoRef={serviceInfoRef}
        onServiceInfoUpdated={checkIfValidateKidAge}
      />
    </View>
  )
}

export default PublicService
