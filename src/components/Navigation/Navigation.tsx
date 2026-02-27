import { getApp } from '@react-native-firebase/app'
import {
  ReactNativeFirebaseAppCheckProvider,
  getToken,
  initializeAppCheck,
} from '@react-native-firebase/app-check'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, View } from 'react-native'
import Config from 'react-native-config'
import 'isomorphic-webcrypto'

import { SvgIcon, HeaderTitle } from '../common'

import ChatStackNavigator from './ChatStackNavigator'
import Container from './NavigationContainer'
import { NavigationStackParams } from './NavigationProps'
import deepLinking from './deepLinking'
import getStyles from './styles'

import { IS_ANDROID } from '@src/constants'
import { useNetwork } from '@src/hooks'
import { useMessagePickup } from '@src/hooks/agent/useMessagePickup'
import { useConfig } from '@src/hooks/providers/ConfigProvider'
import {
  HomeMain,
  SignUpMain,
  ProfileCreation,
  RestoreWalletBackup,
  ConnectionDetails,
  ConnectionInvitation,
  RelatedConnections,
  UserProfile,
  WalletBackup,
  ChangeBackupPassword,
  UserInvitation,
  Connections,
  ConnectionsForNewChat,
  Privacy,
  Developer,
  CredentialDetails,
  DidcommCredentialOffer,
  DidcommPresentationRequest,
  CredentialPresented,
  ForwardConnection,
  PresentCredential,
  CredentialPresentation,
  ParentalControl,
  SelectCredentialAttributes,
  PresentCredentialsFromChat,
  PresentCredentialAsQR,
  EphemeralCredentialPresentation,
} from '@src/pages'
import { MobileAgent } from '@src/services/agent'
import { AppTheme, getGlobalStyles } from '@src/styles'
import { log, logError } from '@src/utils'

const Stack = createStackNavigator<NavigationStackParams>()
type NavigationProps = {
  isSignedUp: boolean
  agent: MobileAgent
  theme: AppTheme
}

const Navigation = ({ isSignedUp, agent, theme }: NavigationProps) => {
  const { t } = useTranslation()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  const { isDeveloperMode } = useConfig()
  const InitialComponent = isSignedUp ? HomeMain : isDeveloperMode ? SignUpMain : ProfileCreation

  const { assertConnectedNetwork } = useNetwork()
  const isNetworkConnected = assertConnectedNetwork()

  useMessagePickup({
    isEnabled: isSignedUp && isNetworkConnected,
    agent,
  })

  useEffect(() => {
    const configureFirebaseProviderAndInitializeAppCheck = async () => {
      const provider = new ReactNativeFirebaseAppCheckProvider()
      provider.configure({
        android: {
          provider: Config.APP_CHECK_DEBUG_MODE ? 'debug' : 'playIntegrity',
          debugToken: '8305FD57-71EF-476A-AC15-32482CAECC44',
        },
        apple: {
          provider: Config.APP_CHECK_DEBUG_MODE ? 'debug' : 'appAttestWithDeviceCheckFallback',
          debugToken: 'CED23F53-F6B4-4D58-AEB3-EDBADC2BDAE3',
        },
      })
      const appCheck = await initializeAppCheck(getApp(), {
        provider,
        isTokenAutoRefreshEnabled: true,
      })
      // Now verify AppCheck was initialized correctly
      try {
        const { token } = await getToken(appCheck)
        if (token.length) log('AppCheck verification passed')
      } catch (error) {
        logError(`AppCheck verification failed: ${error}`)
      }
    }
    configureFirebaseProviderAndInitializeAppCheck()
  }, [])

  useEffect(() => {
    if (IS_ANDROID) {
      StatusBar.setBarStyle(theme.isDarkMode ? 'light-content' : 'dark-content', true)
      StatusBar.setBackgroundColor(globalStyles.headerStyle.backgroundColor, true)
    }
  }, [theme.isDarkMode])

  return (
    <NavigationContainer linking={deepLinking} theme={theme.isDarkMode ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <Stack.Navigator
          key="stack_navigator_main"
          screenOptions={({ route }) => ({
            cardStyle: styles.cardStyle,
            headerStyle: globalStyles.headerStyle,
            headerBackTitle: '',
            headerBackAllowFontScaling: true,
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t(`navigation.${route.name}`)} theme={theme} />,
            headerBackImage: () => (
              <View style={styles.containerIconBakc}>
                <SvgIcon name="arrowLeft" width={18} height={18} fill={theme.colors.primaryText} />
              </View>
            ),
          })}
        >
          <Stack.Screen name="Home" component={InitialComponent} options={{ headerShown: false }} />
          <Stack.Screen name="ChatStack" component={ChatStackNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="ProfileCreation" component={ProfileCreation} />
          <Stack.Screen
            name="RestoreWalletBackup"
            component={RestoreWalletBackup}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="ConnectionDetails" component={ConnectionDetails} />
          <Stack.Screen name="RelatedConnections" component={RelatedConnections} />
          <Stack.Screen name="DidcommCredentialOffer" component={DidcommCredentialOffer} />
          <Stack.Screen name="DidcommPresentationRequest" component={DidcommPresentationRequest} />
          <Stack.Screen name="ConnectionInvitation" component={ConnectionInvitation} />
          <Stack.Screen name="UserProfile" component={UserProfile} />
          <Stack.Screen name="UserInvitation" component={UserInvitation} />
          <Stack.Screen name="Connections" component={Connections} />
          <Stack.Screen name="ConnectionsForNewChat" component={ConnectionsForNewChat} />
          <Stack.Screen name="Privacy" component={Privacy} />
          <Stack.Screen name="Developer" component={Developer} />
          <Stack.Screen name="WalletBackup" component={WalletBackup} />
          <Stack.Screen name="ChangeBackupPassword" component={ChangeBackupPassword} />
          <Stack.Screen name="CredentialDetails" component={CredentialDetails} />
          <Stack.Screen name="CredentialPresented" component={CredentialPresented} />
          <Stack.Screen name="ForwardConnection" component={ForwardConnection} />
          <Stack.Screen name="PresentCredential" component={PresentCredential} />
          <Stack.Screen name="CredentialPresentation" component={CredentialPresentation} />
          <Stack.Screen name="ParentalControl" component={ParentalControl} />
          <Stack.Screen name="PresentCredentialsFromChat" component={PresentCredentialsFromChat} />
          <Stack.Screen name="SelectCredentialAttributes" component={SelectCredentialAttributes} />
          <Stack.Screen
            name="PresentCredentialAsQR"
            component={PresentCredentialAsQR}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="EphemeralCredentialPresentation" component={EphemeralCredentialPresentation} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  )
}

export default Container(Navigation)
