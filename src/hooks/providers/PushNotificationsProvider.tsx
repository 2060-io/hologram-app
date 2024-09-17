import notifee, { Notification, EventType } from '@notifee/react-native'
import * as React from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { log } from '@2060/utils'

interface Props {
  children?: React.ReactNode
}

export type PushNotification = {
  screen: string
  params?: Record<string, unknown>
}

export interface PushNotificationsContextInterface {
  pushNotification: PushNotification | undefined
  setPushNotification: React.Dispatch<React.SetStateAction<PushNotification | undefined>>
}

const PushNotificationsContext = createContext<PushNotificationsContextInterface | undefined>(undefined)

export const usePushNotifications = () => {
  const pushNotificationsContext = useContext(PushNotificationsContext)
  if (!pushNotificationsContext) {
    throw new Error('usePushNotifications must be used within a PushNotificationsContextProvider')
  }

  return pushNotificationsContext
}

export const PushNotificationsProvider: React.FC<React.PropsWithChildren<Props>> = ({ children }) => {
  const [pushNotification, setPushNotification] = useState<PushNotification>()

  const onNotificationPressed = useCallback((notification?: Notification) => {
    const data = notification?.data
    if (data) {
      setPushNotification({
        screen: data.screen as string,
        params: data.params as Record<string, unknown>,
      })
    }
  }, [])

  // Check if app was open from quit state by a notification
  useEffect(() => {
    async function getInitialNotification() {
      const initialNotification = await notifee.getInitialNotification()
      if (initialNotification) {
        log('Notification caused application to open', initialNotification)
        onNotificationPressed(initialNotification.notification)
      }
    }
    getInitialNotification()
  }, [])

  /* In iOS is triggered when user receives local notification and app is in background state
    In Android is triggered when user receives or press local notification and app is in background state
  */
  useEffect(() => {
    return notifee.onBackgroundEvent(async ({ type, detail }) => {
      log(`onBackgroundEvent: ${type}, ${JSON.stringify(detail)}`)
      //In Android if user press a background notification
      if (type === EventType.PRESS) {
        onNotificationPressed(detail.notification)
      }
    })
  }, [])

  // in IOS is triggered when user press or dismiss a local or FCM notification and is in foreground state
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          log('User dismissed notification', detail.notification)
          break
        //In iOS if user press a "background" notification
        case EventType.PRESS:
          log('User pressed notification', detail.notification)
          onNotificationPressed(detail.notification)
          break
      }
    })
  }, [])

  return (
    <PushNotificationsContext.Provider
      value={{
        pushNotification,
        setPushNotification,
      }}
    >
      {children}
    </PushNotificationsContext.Provider>
  )
}
