import React, { ElementType, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import getStyles from './styles'

import { Loader } from '@2060/components/common'
import { useWallet } from '@2060/hooks'
import { useNavigation, useMobileAgent } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { language } from '@2060/utils/language'

const NavigationContainer = (Navigation: ElementType) => {
  const WrapperNavigation = () => {
    const { i18n } = useTranslation()
    const theme = useTheme()
    const styles = getStyles(theme)
    const { getLocalAuth } = useNavigation()
    const isAuthenticated = getLocalAuth()
    const { isSignedUp, agent } = useMobileAgent()
    const { openingWallet, openWallet } = useWallet(true)

    useEffect(() => {
      i18n.changeLanguage(language)
    }, [])

    useEffect(() => {
      if (isAuthenticated) openWallet()
    }, [isAuthenticated])

    return (
      <KeyboardProvider>
        <View style={styles.container}>
          <View style={[styles.containerOpeningWallet, openingWallet ? styles.display : styles.hide]}>
            <Loader />
          </View>
          <View style={[styles.container, !openingWallet ? styles.display : styles.hide]}>
            <Navigation isSignedUp={isSignedUp} agent={agent} theme={theme} />
          </View>
        </View>
      </KeyboardProvider>
    )
  }

  return WrapperNavigation
}

export default NavigationContainer
