import { getMessaging } from '@react-native-firebase/messaging'
import React, { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import App from './App'

// See documentation about Headless: https://rnfirebase.io/messaging/usage#background-application-state
const AppHeadless = () => {
  const [isHeadless, setIsHeadless] = useState<boolean>(true)
  const [appState, setAppState] = useState(AppState.currentState)
  const appStateSubscription = useRef<ReturnType<typeof AppState.addEventListener>>(undefined)

  useEffect(() => {
    appStateSubscription.current = AppState.addEventListener('change', setAppState)
  }, [])

  useEffect(() => {
    getMessaging()
      .getIsHeadless()
      .then(headless => {
        setIsHeadless(headless)
        const userEntersToApp = !headless && appState === 'active'
        if (userEntersToApp) appStateSubscription.current?.remove() // Clean up listener if user opens the app
      })
  }, [appState])

  return isHeadless ? null : <App />
}

export default AppHeadless
