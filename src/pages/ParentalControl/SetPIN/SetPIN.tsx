import { TypedArrayEncoder } from '@credo-ts/core'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView, FlatList, TouchableOpacity } from 'react-native'

import Dial from './Dial'
import getStyles from './styles'

import { Modal, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { retrieveKey, KeyChainService, aes256KeyFromSeed } from '@2060/services/keys'

type OnSuccessCallback = { action: ActionToTake; pinCode?: string }

export type OnCloseSetPINCallback = {
  wasSuccessful: boolean
  action?: ActionToTake
  pinCode?: string
}

type Mode = 'enable' | 'disable' | 'pinConfirmation'
type Props = {
  visible: boolean
  onRequestClose: (args: OnCloseSetPINCallback) => void
  mode: Mode
}

type FlowState = 'initial' | 'confirmingPin' | 'pinDoesNotMatch'
type ActionToTake = 'storePIN' | 'disablePIN' | undefined
const DIAL_PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del']
const PIN_LENGTH = 4

const SetPIN = ({ visible, onRequestClose, mode }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const firstPinCode = useRef<number[]>([])
  const [currentPinCode, setCurrentPinCode] = useState<number[]>([])
  const [currentFlowState, setCurrentFlowState] = useState<FlowState>('initial')

  const resetPinCode = () => setCurrentPinCode([])

  const success = (args: OnSuccessCallback) => {
    onRequestClose({ wasSuccessful: true, ...args })
    cleanState()
  }

  const cancel = () => {
    onRequestClose({ wasSuccessful: false })
    cleanState()
  }

  const cleanState = () => {
    firstPinCode.current = []
    resetPinCode()
    setCurrentFlowState('initial')
  }

  const onFirstPinCodeSet = (pinCode: number[]) => {
    firstPinCode.current = pinCode
    resetPinCode()
    setCurrentFlowState('confirmingPin')
  }

  const pinDoesNotMatch = () => {
    resetPinCode()
    setCurrentFlowState('pinDoesNotMatch')
  }

  const validatePinMatches = (pinCode: number[]) => {
    const pinCodeToString = pinCode.join('')
    const pinMatches = firstPinCode.current.join('') === pinCodeToString
    if (pinMatches) {
      success({ action: 'storePIN', pinCode: pinCodeToString })
    } else {
      pinDoesNotMatch()
    }
  }

  const validatePIN = async (pinCode: number[]) => {
    const storedPIN = await retrieveKey(KeyChainService.ParentalControlPIN)
    const pinMatches = TypedArrayEncoder.toHex(aes256KeyFromSeed(pinCode.join(''))) === storedPIN
    if (pinMatches) {
      success({ action: mode === 'disable' ? 'disablePIN' : undefined })
    } else {
      pinDoesNotMatch()
    }
  }

  const onPinSet = (pinCode: number[]) => {
    if (mode === 'disable' || mode === 'pinConfirmation') {
      validatePIN(pinCode)
      return
    }
    if (currentFlowState === 'initial') {
      onFirstPinCodeSet(pinCode)
    } else {
      validatePinMatches(pinCode)
    }
  }

  const onDialPressed = (pin: number | string) => {
    const isDeletePressed = typeof pin === 'string'
    if (isDeletePressed) {
      setCurrentPinCode(prev => prev.slice(0, prev.length - 1))
    } else if (currentPinCode.length < PIN_LENGTH) {
      const newPinCode = [...currentPinCode, pin]
      setCurrentPinCode(newPinCode)
      const isPINSet = newPinCode.length === PIN_LENGTH
      if (isPINSet) {
        //This timeout is added to user can see all capsules filled before reset them
        //(pin does not match or continues to confirm pin)
        setTimeout(() => {
          onPinSet(newPinCode)
        }, 250)
      }
    }
  }

  const getTitleForInitialState: Record<Mode, string> = {
    enable: t('parentalControl.setPIN'),
    disable: t('parentalControl.disable'),
    pinConfirmation: t('parentalControl.confirmPIN'),
  }

  const getTitle = (flowState: FlowState) => {
    if (flowState === 'initial') return getTitleForInitialState[mode]
    if (flowState === 'confirmingPin') return t('parentalControl.confirmPIN')
    if (flowState === 'pinDoesNotMatch') return t('parentalControl.pinDoesNotMatch')
  }

  const getFooter = (flowState: FlowState) => {
    if (mode === 'disable' || mode === 'pinConfirmation') return t('parentalControl.disablePINFooter')
    if (flowState !== 'pinDoesNotMatch') return t('parentalControl.setPINFooter')
    return t('parentalControl.pinDoesNotMatchFooter')
  }

  return (
    <Modal visible={visible} transparent>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <Text typography="EuclidCircularA-SemiBold" style={styles.title}>
            {getTitle(currentFlowState)}
          </Text>
          <View style={styles.pinContainer}>
            {[...Array(PIN_LENGTH)].map((pin, index) => {
              const isPinFilled = currentPinCode[index] >= 0
              const style = isPinFilled ? styles.pinFilled : styles.pinNotFilled
              return <View key={`${pin}-${index}`} style={{ ...styles.pin, ...style }} />
            })}
          </View>
          <FlatList
            style={styles.dialPadContainer}
            numColumns={3}
            data={DIAL_PAD}
            columnWrapperStyle={{ gap: 20 }}
            contentContainerStyle={{ gap: 20 }}
            keyExtractor={(_, index) => `${index}`}
            scrollEnabled={false}
            renderItem={({ item }) => <Dial dial={item} onDialPressed={onDialPressed} />}
          />
          <Text typography="EuclidCircularA-Regular" style={styles.footerText}>
            {getFooter(currentFlowState)}
          </Text>
          <TouchableOpacity onPress={cancel} style={styles.cancelButton}>
            <Text typography="EuclidCircularA-Medium" style={styles.cancelText}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

export default SetPIN
