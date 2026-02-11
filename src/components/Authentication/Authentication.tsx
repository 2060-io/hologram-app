import { authenticateAsync, getEnrolledLevelAsync, SecurityLevel } from 'expo-local-authentication'
import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import getStyles from './styles'

import AppIcon from '@src/assets/icons/AppIcon'
import { SvgIcon, Text } from '@src/components/common'
import { useNavigation } from '@src/hooks/agent/NavigationProvider'
import { useTheme } from '@src/hooks/providers/ThemeProvider'

type Props = {
  isAppActive: boolean
  makeAutomaticAuth: boolean
}

const Authentication = ({ isAppActive, makeAutomaticAuth }: Props) => {
  const { t } = useTranslation()
  const [userHasBiometricAuthEnable, setUserHasBiometricAuthEnable] = useState(true)
  const { setLocalAuth } = useNavigation()
  const promptMessage = useRef('authenticatePrompt')

  const theme = useTheme()
  const styles = getStyles(theme)

  useEffect(() => {
    if (isAppActive && makeAutomaticAuth) makeBiometricAuth()
  }, [isAppActive])

  const makeBiometricAuth = async () => {
    const enrolledLevel = await getEnrolledLevelAsync()

    if (enrolledLevel === SecurityLevel.NONE) {
      promptMessage.current = 'enableOsAuthPrompt'
      setUserHasBiometricAuthEnable(false)
      return
    }

    const result = await authenticateAsync({
      cancelLabel: t('authentication.cancelLabel'),
      promptMessage: t('authentication.promptMessage'),
      fallbackLabel: t('authentication.fallbackLabel'),
    })

    setLocalAuth(result.success)
    setUserHasBiometricAuthEnable(true)
  }

  return (
    <View style={styles.container}>
      <View style={styles.fullOverlay}>
        <View style={styles.containerBgView}>
          <View style={styles.containerAuthCard}>
            <AppIcon />
            <Text fontFamily="EuclidCircularA-Bold" style={styles.title}>
              {t('authentication.walletLocked')}
            </Text>
            {userHasBiometricAuthEnable ? (
              <>
                <Text style={styles.enableText}>{t(`authentication.${promptMessage.current}`)}</Text>
                <TouchableOpacity
                  onPress={makeBiometricAuth}
                  activeOpacity={0.5}
                  style={styles.containerBtnAuth}
                >
                  <SvgIcon name="authBlocked" fill={theme.colors.white} />
                  <Text fontFamily="EuclidCircularA-Medium" style={styles.btnAuthText}>
                    {t('authentication.auth')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.containerEnableError}>
                  <View style={styles.containerIconWarning}>
                    <SvgIcon name="warning" width={19.6} height={17.1} fill={theme.colors.primary} />
                  </View>
                  <Text style={styles.enableErrorText}>{t(`authentication.${promptMessage.current}`)}</Text>
                </View>
                <TouchableOpacity
                  onPress={makeBiometricAuth}
                  activeOpacity={0.5}
                  style={styles.containerBtnRetry}
                >
                  <Text fontFamily="EuclidCircularA-Medium" style={styles.btnRetryText}>
                    {t('authentication.retry')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

export default Authentication
