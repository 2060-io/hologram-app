import 'reflect-metadata'
// Workaround for issue in Askar wrapper register method (to be fixed in 0.5)
import '@openwallet-foundation/askar-react-native'
import { extend, locale } from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/es'
import 'dayjs/locale/fr'

import Navigation from '@src/components/Navigation'
import {
  AgentActionQueueProvider,
  ChatsProvider,
  ConnectionsProvider,
  CredentialsProvider,
  FileUploadDownloadProvider,
  MobileAgentProvider,
  NavigationProvider,
  UserProfileProvider,
} from '@src/hooks/agent'
import {
  ConfigProvider,
  PushNotificationsProvider,
  RealmProvider,
  RefreshedAvatarsUrlsProvider,
  ScreenLockProvider,
  SharedDataFromOtherAppsProvider,
  ThemeProvider,
  VideoCallProvider,
} from '@src/hooks/providers'
import { initializeI18n, language } from '@src/utils/language'
import { deleteRemoteNotifications } from '@src/utils/pushNotificationsUtils'
import React, { PropsWithChildren, ReactNode, useEffect, useState } from 'react'
import { AppState } from 'react-native'
import BootSplash from 'react-native-bootsplash'
import Toast from './components/Toast'

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
])

const App = () => {
  const [translationsLoaded, setTranslationsLoaded] = useState(false)
  initializeI18n.then(() => setTranslationsLoaded(true))

  useEffect(() => {
    BootSplash.hide({ fade: true })
  }, [])

  // Force-clear the "checking for new messages" placeholder when the app opens, in case it is
  // not cleared yet (seen in some cases on iOS).
  useEffect(() => {
    deleteRemoteNotifications()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') deleteRemoteNotifications()
    })
    return () => subscription.remove()
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
