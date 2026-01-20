import { locale, extend } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'
import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import SplashScreen from 'react-native-splash-screen'

import Toast from './components/Toast'

import Navigation from '@2060/components/Navigation'
import {
  MobileAgentProvider,
  NavigationProvider,
  UserProfileProvider,
  ConnectionProvider,
  ChatProvider,
  CredentialProvider,
  FileUploadDownloadProvider,
  AgentActionQueueProvider,
} from '@2060/hooks/agent'
import {
  ConfigProvider,
  PushNotificationsProvider,
  RealmProvider,
  ScreenLockProvider,
  SharedDataFromOtherAppsProvider,
  ThemeProvider,
  VideoCallProvider,
  RefreshedAvatarsUrlsProvider,
} from '@2060/hooks/providers'
import { initializeI18n, language } from '@2060/utils/language'

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
  [ConnectionProvider],
  [CredentialProvider],
  [ChatProvider],
  [UserProfileProvider],
  [NavigationProvider],
  [PushNotificationsProvider],
  [FileUploadDownloadProvider],
  [RefreshedAvatarsUrlsProvider],
  [VideoCallProvider],
  [ScreenLockProvider],
  [SharedDataFromOtherAppsProvider],
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
