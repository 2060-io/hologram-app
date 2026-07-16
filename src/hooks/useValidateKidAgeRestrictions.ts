import { KID_BIRTHDATE_DATE_FORMAT } from '@src/constants'
import { ServiceStatus } from '@src/model'
import { ParentalControlEnum, retrieveKeyInConfigFile } from '@src/services/config'
import { dateToString, stringToDate, timeFromNow } from '@src/utils/dateUtils'
import { TrustResolutionOutcome } from '@verana-labs/verre'
import { useEffect, useState } from 'react'

const calculateAge = (kidBirthday: string) => {
  return timeFromNow(stringToDate(kidBirthday, KID_BIRTHDATE_DATE_FORMAT), 'year')
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
      const ageValidationIsNotRequired = minimumAgeRequired <= 0 && serviceStatus === TrustResolutionOutcome.VERIFIED
      if (ageValidationIsNotRequired) return
      const isParentalControlEnabled = await retrieveKeyInConfigFile(ParentalControlEnum.Enabled)
      if (isParentalControlEnabled === 'true') validateKidCanConnect()
    }

    const validateKidCanConnect = async () => {
      const kidBirthday =
        (await retrieveKeyInConfigFile(ParentalControlEnum.KidBirthday)) ??
        dateToString(new Date(), KID_BIRTHDATE_DATE_FORMAT)
      const age = calculateAge(kidBirthday)
      const canNotConnect = age < minimumAgeRequired || serviceStatus !== TrustResolutionOutcome.VERIFIED
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
