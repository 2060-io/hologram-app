import 'reflect-metadata'
// Workaround for issue in Askar wrapper register method (to be fixed in 0.5)
import '@openwallet-foundation/askar-react-native'
import { locale, extend } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import SplashScreen from 'react-native-splash-screen'

import Toast from './components/Toast'

import Navigation from '@src/components/Navigation'
import {
  MobileAgentProvider,
  NavigationProvider,
  UserProfileProvider,
  ConnectionsProvider,
  ChatsProvider,
  CredentialsProvider,
  FileUploadDownloadProvider,
  AgentActionQueueProvider,
} from '@src/hooks/agent'
import {
  ConfigProvider,
  PushNotificationsProvider,
  RealmProvider,
  ScreenLockProvider,
  SharedDataFromOtherAppsProvider,
  ThemeProvider,
  VideoCallProvider,
  RefreshedAvatarsUrlsProvider,
  BuildBackupProvider,
} from '@src/hooks/providers'
import { initializeI18n, language } from '@src/utils/language'

locale(language)
extend(localizedFormat)

const buildProvidersTree = (componentsWithProps: React.FC<PropsWithChildren>[][]) => {
  const initialComponent = ({ children }: { children?: ReactNode | undefined }) => <>{children}</>
  return componentsWithProps.reduce((AccumulatedComponents, [Provider, props = {}]) => {
    return ({ children }) => {
      return (
        <AccumulatedComponents>
          <Provider {...props}>{children}</Provider>
        </AccumulatedComponents>
      )
    }
  }, initialComponent)
}

const ProvidersTree = buildProvidersTree([
  [ConfigProvider],
  [ThemeProvider],
  [RealmProvider],
  [MobileAgentProvider],
  [AgentActionQueueProvider],
  [ConnectionsProvider],
  [CredentialsProvider],
  [ChatsProvider],
  [UserProfileProvider],
  [NavigationProvider],
  [PushNotificationsProvider],
  [FileUploadDownloadProvider],
  [RefreshedAvatarsUrlsProvider],
  [VideoCallProvider],
  [ScreenLockProvider],
  [SharedDataFromOtherAppsProvider],
  [BuildBackupProvider],
])

const App = () => {
  const [translationsLoaded, setTranslationsLoaded] = useState(false)
  initializeI18n.then(() => setTranslationsLoaded(true))

  useEffect(() => {
    SplashScreen.hide()
  }, [])

  return (
    <>
      <Toast />
      {translationsLoaded ? (
        <ProvidersTree>
          <Navigation />
        </ProvidersTree>
      ) : null}
    </>
  )
}

export default App
