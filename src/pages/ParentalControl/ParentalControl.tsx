import dayjs, { extend } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity } from 'react-native'
import DatePicker from 'react-native-date-picker'

extend(customParseFormat)
import SetPIN from './SetPIN'
import { OnCloseSetPINCallback } from './SetPIN/SetPIN'
import getStyles from './styles'

import { OptionsList, Switch, Text } from '@2060/components/common'
import { KID_BIRTHDATE_DATE_FORMAT } from '@2060/constants'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { storeValueInConfigFile, ParentalControlEnum } from '@2060/services/config'
import { createAndStoreKey, deleteKey, KeyChainService, retrieveKey } from '@2060/services/keys'

const convertStringToDate = (dateString: string) => {
  return dayjs(dateString, KID_BIRTHDATE_DATE_FORMAT).toDate()
}

const ParentalControl = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const [isParentalControlEnabled, setParentalControlEnabled] = useState(false)
  const [kidBirthday, setKidBirthday] = useState(new Date())
  const [openDatePicker, setOpenDatePicker] = useState(false)
  const [openSetControlPIN, setOpenSetControlPIN] = useState(false)
  const [openPINConfirmation, setOpenPINConfirmation] = useState(false)
  const canChangeBirthday = useRef(false)

  useEffect(() => {
    const loadIsParentalControlEnabled = async () => {
      const storedValue = await retrieveKey(ParentalControlEnum.Enabled)
      if (storedValue) {
        setParentalControlEnabled(storedValue === 'true')
      }
    }
    const loadKidBirthday = async () => {
      const storedValue = await retrieveKey(ParentalControlEnum.KidBirthday)
      if (storedValue) {
        const storedDate = convertStringToDate(storedValue)
        setKidBirthday(storedDate)
      } else {
        storeValueInConfigFile(
          ParentalControlEnum.KidBirthday,
          dayjs(new Date()).format(KID_BIRTHDATE_DATE_FORMAT),
        )
      }
    }
    loadIsParentalControlEnabled()
    loadKidBirthday()
  }, [])

  useEffect(() => {
    if (canChangeBirthday.current) setOpenDatePicker(true)
  }, [openPINConfirmation])

  const changeParentalControlStatus = async () => {
    const newIsParentalControlEnabled = !isParentalControlEnabled
    setParentalControlEnabled(newIsParentalControlEnabled)
    await storeValueInConfigFile(ParentalControlEnum.Enabled, newIsParentalControlEnabled.toString())
  }

  const onToggleParentalControlSwitch = () => {
    setOpenSetControlPIN(true)
    changeParentalControlStatus()
  }

  const closeSetPIN = (args: OnCloseSetPINCallback) => {
    const { wasSuccessful, action, pinCode } = args
    if (!wasSuccessful) changeParentalControlStatus()
    setOpenSetControlPIN(false)
    if (action === 'storePIN' && pinCode) {
      createAndStoreKey(KeyChainService.ParentalControlPIN, pinCode)
    }
    if (action === 'disablePIN') deleteKey(KeyChainService.ParentalControlPIN)
  }

  const changeKidBirthdate = (date: Date) => {
    setKidBirthday(date)
    storeValueInConfigFile(ParentalControlEnum.KidBirthday, dayjs(date).format(KID_BIRTHDATE_DATE_FORMAT))
  }

  const options = [
    {
      text: t('navigation.ParentalControl'),
      rightContent: () => (
        <Switch isChecked={isParentalControlEnabled} onToggle={onToggleParentalControlSwitch} />
      ),
    },
    {
      text: t('parentalControl.kidBirthday'),
      rightContent: () => (
        <TouchableOpacity
          disabled={!isParentalControlEnabled}
          onPress={() => setOpenPINConfirmation(true)}
          style={styles.birthdayContainer}
        >
          <Text typography="EuclidCircularA-Regular" style={styles.birthdayText}>
            {dayjs(kidBirthday).format('DD/MM/YYYY')}
          </Text>
        </TouchableOpacity>
      ),
    },
  ]

  const closePINConfirmation = (args: OnCloseSetPINCallback) => {
    setOpenPINConfirmation(false)
    if (args.wasSuccessful) canChangeBirthday.current = true
  }

  const onConfirmBirthdate = (date: Date) => {
    setOpenDatePicker(false)
    changeKidBirthdate(date)
    canChangeBirthday.current = false
  }

  return (
    <SafeAreaView style={styles.container}>
      <SetPIN
        visible={openSetControlPIN}
        mode={isParentalControlEnabled ? 'enable' : 'disable'}
        onRequestClose={closeSetPIN}
      />
      <SetPIN visible={openPINConfirmation} mode="pinConfirmation" onRequestClose={closePINConfirmation} />
      <DatePicker
        modal
        mode="date"
        open={openDatePicker}
        title={t('parentalControl.kidBirthday')}
        date={kidBirthday}
        maximumDate={new Date()}
        onConfirm={onConfirmBirthdate}
        onCancel={() => {
          setOpenDatePicker(false)
          canChangeBirthday.current = false
        }}
      />
      <Text typography="EuclidCircularA-Regular" style={styles.parentalControlMessage}>
        {t('parentalControl.message')}
      </Text>
      <OptionsList options={options} />
    </SafeAreaView>
  )
}

export default ParentalControl
