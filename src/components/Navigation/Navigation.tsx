import { getApp } from '@react-native-firebase/app'
import {
  ReactNativeFirebaseAppCheckProvider,
  getToken,
  initializeAppCheck,
} from '@react-native-firebase/app-check'
import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StatusBar, View } from 'react-native'
import Config from 'react-native-config'
import 'isomorphic-webcrypto'

import { SvgIcon, HeaderTitle } from '../common'

import Container from './NavigationContainer'
import { NavigationStackParams } from './NavigationProps'
import PersonalChatStackNavigator from './PersonalChatStackNavigator'
import deepLinking from './deepLinking'
import getStyles from './styles'

import { useNetwork } from '@2060/hooks'
import { useMessagePickup } from '@2060/hooks/agent/useMessagePickup'
import { useConfig } from '@2060/hooks/providers/ConfigProvider'
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
  OpenIdCredentialOffer,
  DidcommPresentationRequest,
  OpenIdPresentationRequest,
  CredentialPresented,
  ForwardConnection,
  PresentCredential,
  Presentation,
  ParentalControl,
} from '@2060/pages'
import { MobileAgent } from '@2060/services/agent'
import { AppTheme, getGlobalStyles } from '@2060/styles'
import { log, logError } from '@2060/utils'

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
    const messaging = getMessaging()
    const unsubscribe = onTokenRefresh(messaging, (deviceToken: string) => {
      agent?.mediationRecipient.findDefaultMediatorConnection().then(mediatorConnection => {
        if (mediatorConnection) {
          agent?.modules.pushNotifications.setDeviceInfo(mediatorConnection.id, {
            deviceToken,
            devicePlatform: Platform.OS,
          })
        }
      })
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    StatusBar.setBarStyle(theme.isDarkMode ? 'light-content' : 'dark-content', true)
    StatusBar.setBackgroundColor(globalStyles.headerStyle.backgroundColor, true)
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
          <Stack.Screen
            name="PersonalChatStack"
            component={PersonalChatStackNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ProfileCreation" component={ProfileCreation} />
          <Stack.Screen
            name="RestoreWalletBackup"
            component={RestoreWalletBackup}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="ConnectionDetails" component={ConnectionDetails} />
          <Stack.Screen name="RelatedConnections" component={RelatedConnections} />
          <Stack.Screen name="DidcommCredentialOffer" component={DidcommCredentialOffer} />
          <Stack.Screen name="OpenIdCredentialOffer" component={OpenIdCredentialOffer} />
          <Stack.Screen name="DidcommPresentationRequest" component={DidcommPresentationRequest} />
          <Stack.Screen name="ConnectionInvitation" component={ConnectionInvitation} />
          <Stack.Screen name="OpenIdPresentationRequest" component={OpenIdPresentationRequest} />
          <Stack.Screen name="UserProfile" component={UserProfile} />
          <Stack.Screen name="UserInvitation" component={UserInvitation} />
          <Stack.Screen name="Connections" component={Connections} />
          <Stack.Screen name="ConnectionsForNewChat" component={ConnectionsForNewChat} />
          <Stack.Screen name="Privacy" component={Privacy} />
          <Stack.Screen name="Developer" component={Developer} />
          <Stack.Screen name="WalletBackup" component={WalletBackup} options={{ gestureEnabled: false }} />
          <Stack.Screen name="ChangeBackupPassword" component={ChangeBackupPassword} />
          <Stack.Screen name="CredentialDetails" component={CredentialDetails} />
          <Stack.Screen name="CredentialPresented" component={CredentialPresented} />
          <Stack.Screen name="ForwardConnection" component={ForwardConnection} />
          <Stack.Screen name="PresentCredential" component={PresentCredential} />
          <Stack.Screen name="Presentation" component={Presentation} />
          <Stack.Screen name="ParentalControl" component={ParentalControl} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  )
}

export default Container(Navigation)
