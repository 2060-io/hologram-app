import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import DatePicker from 'react-native-date-picker'

import SetPIN from './SetPIN'
import { OnCloseSetPINCallback } from './SetPIN/SetPIN'
import getStyles from './styles'

import { OptionsList, Switch, Text } from '@src/components/common'
import { IS_ANDROID, KID_BIRTHDATE_DATE_FORMAT } from '@src/constants'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { storeKeyInConfigFile, retrieveKeyInConfigFile, ParentalControlEnum } from '@src/services/config'
import { createAndStoreEncryptedKey, deleteEncryptedKey, KeyChainService } from '@src/services/keys'
import { dateToString, stringToDate } from '@src/utils/dateUtils'

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
      const storedParentalControlEnabled = await retrieveKeyInConfigFile(ParentalControlEnum.Enabled)
      if (storedParentalControlEnabled) {
        setParentalControlEnabled(storedParentalControlEnabled === 'true')
      }
    }
    const loadKidBirthday = async () => {
      const storedStringKidBirthday = await retrieveKeyInConfigFile(ParentalControlEnum.KidBirthday)
      if (storedStringKidBirthday) {
        const storedKidBirthdate = stringToDate(storedStringKidBirthday, KID_BIRTHDATE_DATE_FORMAT)
        setKidBirthday(storedKidBirthdate)
      } else {
        storeKeyInConfigFile(
          ParentalControlEnum.KidBirthday,
          dateToString(new Date(), KID_BIRTHDATE_DATE_FORMAT),
        )
      }
    }
    loadIsParentalControlEnabled()
    loadKidBirthday()
  }, [])

  useEffect(() => {
    if (canChangeBirthday.current && IS_ANDROID) setOpenDatePicker(true)
  }, [openPINConfirmation])

  const oniOSDismissPINConfirmation = () => {
    if (canChangeBirthday.current) setOpenDatePicker(true)
  }

  const changeParentalControlStatus = async () => {
    const newIsParentalControlEnabled = !isParentalControlEnabled
    setParentalControlEnabled(newIsParentalControlEnabled)
    await storeKeyInConfigFile(ParentalControlEnum.Enabled, newIsParentalControlEnabled.toString())
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
      createAndStoreEncryptedKey(KeyChainService.ParentalControlPIN, pinCode)
    }
    if (action === 'disablePIN') deleteEncryptedKey(KeyChainService.ParentalControlPIN)
  }

  const changeKidBirthdate = (date: Date) => {
    setKidBirthday(date)
    storeKeyInConfigFile(ParentalControlEnum.KidBirthday, dateToString(date, KID_BIRTHDATE_DATE_FORMAT))
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
          <Text style={styles.birthdayText}>{dateToString(kidBirthday, 'DD/MM/YYYY')}</Text>
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
    <View style={styles.container}>
      <SetPIN
        visible={openSetControlPIN}
        mode={isParentalControlEnabled ? 'enable' : 'disable'}
        onRequestClose={closeSetPIN}
      />
      <SetPIN
        visible={openPINConfirmation}
        mode="pinConfirmation"
        onRequestClose={closePINConfirmation}
        oniOSDismiss={oniOSDismissPINConfirmation}
      />
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
      <Text style={styles.parentalControlMessage}>{t('parentalControl.message')}</Text>
      <OptionsList options={options} />
    </View>
  )
}

export default ParentalControl
