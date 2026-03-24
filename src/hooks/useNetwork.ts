import {
  addEventListener,
  fetch as fetchNetInfo,
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo'
import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export const useNetwork = () => {
  const [netInfo, setNetInfo] = useState<NetInfoState>({
    type: NetInfoStateType.unknown,
    isConnected: null,
    isInternetReachable: null,
    details: null,
  })
  const appStateRef = useRef(AppState.currentState)

  useEffect(() => {
    // Subscribe to network state changes (also fetches initial state)
    const unsubscribe = addEventListener(setNetInfo)

    // Re-fetch when app comes to foreground as a safety net
    // in case a native event was missed while backgrounded
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current !== 'active' && nextAppState === 'active') {
        fetchNetInfo().then(setNetInfo)
      }
      appStateRef.current = nextAppState
    })

    return () => {
      unsubscribe()
      appStateSubscription.remove()
    }
  }, [])

  const silentAssertConnectedNetwork = () => {
    return netInfo.isConnected === true
  }

  const assertConnectedNetwork = () => {
    const isConnected = silentAssertConnectedNetwork()

    return isConnected
  }

  return {
    netInfo,
    silentAssertConnectedNetwork,
    assertConnectedNetwork,
  }
}
