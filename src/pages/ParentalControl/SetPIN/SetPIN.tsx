import { TypedArrayEncoder } from '@credo-ts/core'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, SafeAreaView, FlatList, TouchableOpacity } from 'react-native'

import Dial from './Dial'
import getStyles from './styles'

import { Modal, Text } from '@2060/components/common'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import {
  retrieveKey,
  createAndStoreKey,
  deleteKey,
  KeyChainService,
  aes256KeyFromSeed,
} from '@2060/services/keys'

type Mode = 'enable' | 'disable'
type Props = {
  visible: boolean
  close: ({ withSuccess }: { withSuccess: boolean }) => void
  mode: Mode
}
type FlowState = 'initial' | 'confirmingPin' | 'pinDoesNotMatch'

const DIAL_PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del']
const PIN_LENGTH = 4

const SetPIN = ({ visible, close, mode }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const firstPinCode = useRef<number[]>([])
  const [currentPinCode, setCurrentPinCode] = useState<number[]>([])
  const [currentFlowState, setCurrentFlowState] = useState<FlowState>('initial')

  const resetPinCode = () => setCurrentPinCode([])

  const success = () => {
    close({ withSuccess: true })
    cleanState()
  }

  const cancel = () => {
    close({ withSuccess: false })
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
      createAndStoreKey(KeyChainService.ParentalControlPIN, pinCodeToString)
      success()
    } else {
      pinDoesNotMatch()
    }
  }

  const validatePinCodeToDisable = async (pinCode: number[]) => {
    const storedPIN = await retrieveKey(KeyChainService.ParentalControlPIN)
    const pinMatches = TypedArrayEncoder.toHex(aes256KeyFromSeed(pinCode.join(''))) === storedPIN
    if (pinMatches) {
      deleteKey(KeyChainService.ParentalControlPIN)
      success()
    } else {
      pinDoesNotMatch()
    }
  }

  const onPinSet = (pinCode: number[]) => {
    if (mode === 'disable') {
      validatePinCodeToDisable(pinCode)
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

  const getTitle = (flowState: FlowState) => {
    if (flowState === 'initial') {
      if (mode === 'enable') return t('parentalControl.setPIN')
      return t('parentalControl.disable')
    }
    if (flowState === 'confirmingPin') return t('parentalControl.confirmPIN')
    return t('parentalControl.pinDoesNotMatch')
  }

  const getFooter = (flowState: FlowState) => {
    if (mode === 'disable') return t('parentalControl.disablePINFooter')
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
