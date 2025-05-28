import { useEffect, useState } from 'react'

import { KID_BIRTHDATE_DATE_FORMAT } from '@2060/constants'
import { ServiceStatus } from '@2060/services/api/trustRegistryService'
import { ParentalControlEnum, retrieveKeyInConfigFile } from '@2060/services/config'
import { dateToString, timeFromNow } from '@2060/utils/dateUtils'

const calculateAge = (kidBirthday: string) => {
  return timeFromNow(kidBirthday)
}

type Props = {
  minimumAgeRequired: number
  serviceStatus: ServiceStatus
}
export const useValidateKidAgeRestrictions = ({ minimumAgeRequired, serviceStatus }: Props) => {
  const [kidAge, setKidAge] = useState(0)
  const [ageRestricted, setAgeRestricted] = useState(false)

  useEffect(() => {
    const checkIfValidateKidAge = async () => {
      const ageValidationIsNotRequired = minimumAgeRequired <= 0 && serviceStatus === 'trusted'
      if (ageValidationIsNotRequired) return
      const isParentalControlEnabled = await retrieveKeyInConfigFile(ParentalControlEnum.Enabled)
      if (isParentalControlEnabled === 'true') validateKidCanConnect()
    }

    const validateKidCanConnect = async () => {
      const kidBirthday =
        (await retrieveKeyInConfigFile(ParentalControlEnum.KidBirthday)) ??
        dateToString(new Date(), KID_BIRTHDATE_DATE_FORMAT)
      const age = calculateAge(kidBirthday)
      const canNotConnect = age < minimumAgeRequired || serviceStatus !== 'trusted'
      if (canNotConnect) {
        setKidAge(age)
        setAgeRestricted(true)
      }
    }
    checkIfValidateKidAge()
  }, [minimumAgeRequired, serviceStatus])

  return {
    kidAge,
    ageRestricted,
  }
}
