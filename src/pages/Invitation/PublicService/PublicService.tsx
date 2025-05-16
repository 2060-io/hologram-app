import dayjs from 'dayjs'
import React, { useState } from 'react'
import { View } from 'react-native'

import CanNotConnect from './CanNotConnect'

import { ServiceInformation } from '@2060/components/common'
import { KID_BIRTHDATE_DATE_FORMAT } from '@2060/constants'
import { ServiceInfo } from '@2060/services/api/trustRegistryService'
import { ParentalControlEnum } from '@2060/services/config'
import { retrieveKey } from '@2060/services/keys'
import { timeFromNow } from '@2060/utils/dateUtils'

type Props = {
  did: string
  initialServiceInfo: ServiceInfo
  ageRestricted: boolean
  setAgeRestricted(canConnect: boolean): void
}

const calculateAge = (kidBirthday: string) => {
  return timeFromNow(kidBirthday)
}

const PublicService = ({ did, initialServiceInfo, ageRestricted, setAgeRestricted }: Props) => {
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
      setAgeRestricted(true)
    }
  }

  return (
    <View>
      {ageRestricted && <CanNotConnect kidAge={kidAge} />}
      <ServiceInformation
        did={did}
        initialServiceInfo={initialServiceInfo}
        onServiceInfoUpdated={checkIfValidateKidAge}
      />
    </View>
  )
}

export default PublicService
