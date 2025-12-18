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
    /**
     * FIXME: The SplashScreen.hide() was added inside a 0 timeout to
     * works well in android. So a probably reason could be the order
     * execution of this setTimeout in the main thread, even if timeout is 0
     * function well be executed after main thread be free (other react native tasks finished)
     */
    setTimeout(() => {
      SplashScreen.hide()
    }, 0)
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
