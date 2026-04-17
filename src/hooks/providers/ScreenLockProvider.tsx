import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  PropsWithChildren,
} from 'react'
import { View, PanResponder, StyleSheet } from 'react-native'

import { useNavigation } from '../agent/NavigationProvider'
import { useAppState } from '../useAppState'

import { useVideoCallContext } from './useVideoCallContext'

import Authentication from '@src/components/Authentication'
import Modal from '@src/components/common/Modal'
import {
  setStorageData,
  getStorageData,
  SCREEN_LOCK_ENABLED_PERSIST_KEY,
  SCREEN_LOCK_TIMEOUT_PERSIST_KEY,
} from '@src/services/localStorage'

interface ScreenLockInterface {
  isScreenLockEnabled: boolean
  onToggleLockScreen: () => void
  changeScreenLockTimeout: (newLockTimeoutValue: number | null) => void
  screenLockTimeout: number | null
  isScreenLockForceDisabled: boolean
  forceDisableScreenLock: (value: boolean) => void
}

const ScreenLockContext = createContext<ScreenLockInterface | undefined>(undefined)

export const useScreenLock = () => {
  const screenLockContext = useContext(ScreenLockContext)
  if (!screenLockContext) throw new Error('useScreenLock must be used within a LockContextProvider')
  return screenLockContext
}

export const INSTANT_TIMEOUT = 0
export const FIVE_MINUTES_TIMEOUT = 300_000

export const ScreenLockProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isScreenLockForceDisabled, forceDisableScreenLock] = useState(false)
  const { isInCall, isIncomingCall, isFinishedCall } = useVideoCallContext()
  const [isScreenLockEnabled, setIsScreenLockEnabled] = useState(false)
  const [screenLockTimeout, setLockTimeout] = useState<number | null>(null)
  const makeAutomaticAuth = useRef(true)
  const { getLocalAuth, setLocalAuth } = useNavigation()
  const isAuthenticated = getLocalAuth()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { isAppActive } = useAppState()
  const makeLocalLogout = () => setLocalAuth(false)

  useEffect(() => {
    makeAutomaticAuth.current = !isAppActive
  }, [isAppActive])

  useEffect(() => {
    if (isInCall || isIncomingCall) clearInactivityTimeout()
  }, [isInCall, isIncomingCall])

  useEffect(() => {
    if (isFinishedCall) clearAndRestartInactivityTimeout()
  }, [isFinishedCall])

  /**
   * Disable or enable screen lock timeout only when lock timeout is different of INSTANT_TIMEOUT
   */
  useEffect(() => {
    if (screenLockTimeout === INSTANT_TIMEOUT) return
    if (isScreenLockForceDisabled) {
      clearInactivityTimeout()
    } else {
      clearAndRestartInactivityTimeout()
    }
  }, [isScreenLockForceDisabled])

  /**
   * This hook is exclusive when screen lock timeout is instant (0)
   */
  useEffect(() => {
    if (!isAppActive && screenLockTimeout === INSTANT_TIMEOUT && !isScreenLockForceDisabled) {
      makeLocalLogout()
    }
  }, [isAppActive, isScreenLockForceDisabled])

  useEffect(() => {
    const getStoredScreenLockedTimeout = async () => {
      const storedScreenLockTimeout =
        (await getStorageData(SCREEN_LOCK_TIMEOUT_PERSIST_KEY)) ?? FIVE_MINUTES_TIMEOUT
      setLockTimeout(Number(storedScreenLockTimeout))
    }
    getStoredScreenLockedTimeout()
  }, [])

  useEffect(() => {
    clearAndRestartInactivityTimeout()
  }, [screenLockTimeout])

  useEffect(() => {
    if (isAuthenticated) clearAndRestartInactivityTimeout()
  }, [isAuthenticated])

  useEffect(() => {
    const getStoredScreenLock = async () => {
      const storedIsScreenLockEnabled = (await getStorageData(SCREEN_LOCK_ENABLED_PERSIST_KEY)) ?? true
      setIsScreenLockEnabled(Boolean(storedIsScreenLockEnabled))
    }
    getStoredScreenLock()
  }, [])

  const onToggleLockScreen = () => {
    const newIsScreenLockEnabled = !isScreenLockEnabled
    setIsScreenLockEnabled(newIsScreenLockEnabled)
    setStorageData(SCREEN_LOCK_ENABLED_PERSIST_KEY, newIsScreenLockEnabled)
    changeScreenLockTimeout(newIsScreenLockEnabled ? FIVE_MINUTES_TIMEOUT : null)
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => {
      clearAndRestartInactivityTimeout()
      return false
    },
  })

  const clearInactivityTimeout = () => clearTimeout(timerRef?.current)

  const clearAndRestartInactivityTimeout = () => {
    clearInactivityTimeout()
    if (screenLockTimeout && isScreenLockEnabled) {
      timerRef.current = setTimeout(() => {
        makeLocalLogout()
      }, screenLockTimeout)
    }
  }

  const changeScreenLockTimeout = useCallback((newLockTimeoutValue: number | null) => {
    setLockTimeout(newLockTimeoutValue)
    setStorageData(SCREEN_LOCK_TIMEOUT_PERSIST_KEY, newLockTimeoutValue)
  }, [])

  return (
    <ScreenLockContext
      value={{
        isScreenLockEnabled,
        onToggleLockScreen,
        changeScreenLockTimeout,
        screenLockTimeout,
        isScreenLockForceDisabled,
        forceDisableScreenLock,
      }}
    >
      <View style={styles.container} {...panResponder.panHandlers}>
        <Modal visible={!isAuthenticated}>
          <Authentication isAppActive={isAppActive} makeAutomaticAuth={makeAutomaticAuth.current} />
        </Modal>
        {children}
      </View>
    </ScreenLockContext>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
