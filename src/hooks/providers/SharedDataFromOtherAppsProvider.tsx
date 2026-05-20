import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import ShareMenu, { SharedData } from 'react-native-share-menu'

import { useNavigation } from '../agent'
import { useAppState } from '../useAppState'

import { useScreenLock } from './ScreenLockProvider'

interface SharedDataFromOtherAppsInterface {
  displayShareMessagesScreen: boolean
  cancelShare: () => void
  sharedData: SharedData | undefined
}

const SharedDataFromOtherAppsContext = createContext<SharedDataFromOtherAppsInterface | undefined>(undefined)

export const useSharedDataFromOtherApps = () => {
  const sharedDataFromOtherAppsContext = useContext(SharedDataFromOtherAppsContext)
  if (!sharedDataFromOtherAppsContext) {
    throw new Error('useSharedDataFromOtherApps must be used within a SharedDataFromOtherAppsProvider')
  }
  return sharedDataFromOtherAppsContext
}

export const SharedDataFromOtherAppsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { getLocalAuth } = useNavigation()
  const isAuthenticated = getLocalAuth()
  const { isAppActive } = useAppState()

  const [sharedData, setSharedData] = useState<SharedData>()
  const [displayShareMessagesScreen, setDisplayShareMessagesScreen] = useState(false)
  const { isScreenLockEnabled } = useScreenLock()

  const handleSharedAppData = useCallback(
    (newSharedData?: SharedData) => {
      if (newSharedData?.data?.length) {
        setSharedData(newSharedData)
        if (!isScreenLockEnabled) setDisplayShareMessagesScreen(true)
      }
    },
    [isScreenLockEnabled]
  )

  useEffect(() => {
    ShareMenu.getInitialShare(handleSharedAppData)
    const shareMenuListener = ShareMenu.addNewShareListener(handleSharedAppData)
    return () => {
      shareMenuListener.remove()
    }
  }, [handleSharedAppData])

  useEffect(() => {
    if (!isAuthenticated || !sharedData || !isAppActive) return
    setDisplayShareMessagesScreen(true)
  }, [isAuthenticated, sharedData, isAppActive])

  const cancelShare = useCallback(() => {
    setDisplayShareMessagesScreen(false)
    setSharedData(undefined)
  }, [])

  return (
    <SharedDataFromOtherAppsContext value={{ displayShareMessagesScreen, cancelShare, sharedData }}>
      {children}
    </SharedDataFromOtherAppsContext>
  )
}
