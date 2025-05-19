import { useEffect, useState } from 'react'

import { KID_BIRTHDATE_DATE_FORMAT } from '@2060/constants'
import { ParentalControlEnum } from '@2060/services/config'
import { retrieveKey } from '@2060/services/keys'
import { dateToString, timeFromNow } from '@2060/utils/dateUtils'

const calculateAge = (kidBirthday: string) => {
  return timeFromNow(kidBirthday)
}

type Props = {
  minimumAgeRequired: number
}

export const useValidateKidAgeRestrictions = ({ minimumAgeRequired }: Props) => {
  const [kidAge, setKidAge] = useState(0)
  const [ageRestricted, setAgeRestricted] = useState(false)

  useEffect(() => {
    const checkIfValidateKidAge = async () => {
      if (minimumAgeRequired <= 0) return
      const isParentalControlEnabled = await retrieveKey(ParentalControlEnum.Enabled)
      if (isParentalControlEnabled === 'true') validateKidCanConnect()
    }

    const validateKidCanConnect = async () => {
      const kidBirthday =
        (await retrieveKey(ParentalControlEnum.KidBirthday)) ??
        dateToString(new Date(), KID_BIRTHDATE_DATE_FORMAT)
      const age = calculateAge(kidBirthday)
      if (age < minimumAgeRequired) {
        setKidAge(age)
        setAgeRestricted(true)
      }
    }
    checkIfValidateKidAge()
  }, [minimumAgeRequired])

  return {
    kidAge,
    ageRestricted,
  }
}
