import { ParamListBase, StackActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useEffect } from 'react'

import { usePushNotifications } from '@2060/hooks/providers/PushNotificationsProvider'
import { useSharedDataFromOtherApps } from '@2060/hooks/providers/SharedDataFromOtherAppsProvider'
import {
  markNewConnectionNotificationAsViewed,
  markNotificationsOfChatAsViewed,
} from '@2060/utils/pushNotificationsUtils'

export const useHomeMain = ({ navigation }: { navigation: StackNavigationProp<ParamListBase> }) => {
  const { pushNotification, setPushNotification } = usePushNotifications()
  const { displayShareMessagesScreen } = useSharedDataFromOtherApps()

  const handleOnPushNotificationPressed = () => {
    if (pushNotification) {
      setTimeout(() => {
        if (pushNotification.screen === 'ConnectionDetails') {
          markNewConnectionNotificationAsViewed(pushNotification.params?.connectionId as string)
          navigation.dispatch(
            StackActions.push('ConnectionDetails', {
              connectionId: pushNotification.params?.connectionId,
            }),
          )
        }
        if (pushNotification.screen === 'PersonalChat') {
          markNotificationsOfChatAsViewed(pushNotification.params?.connectionId as string)
          const currentScreenParams = navigation.getState().routes.at(-1)?.params as {
            screen?: string
            params?: Record<string, unknown>
          }
          const isChatCurrentScreen = currentScreenParams?.screen === 'PersonalChat'
          if (isChatCurrentScreen) {
            const isUserInTheChatOfTheNotification =
              currentScreenParams?.params?.chatThreadId === pushNotification.params?.chatThreadId
            if (!isUserInTheChatOfTheNotification) {
              navigation.dispatch(
                StackActions.replace('PersonalChatStack', {
                  screen: 'PersonalChat',
                  params: { chatThreadId: pushNotification.params?.chatThreadId },
                }),
              )
            }
          } else {
            navigation.dispatch(
              StackActions.push('PersonalChatStack', {
                screen: 'PersonalChat',
                params: { chatThreadId: pushNotification.params?.chatThreadId },
              }),
            )
          }
        }
        setPushNotification(undefined)
      }, 500)
    }
  }

  useEffect(handleOnPushNotificationPressed, [pushNotification])

  useEffect(() => {
    if (displayShareMessagesScreen) {
      navigation.dispatch(StackActions.push('PersonalChatStack', { screen: 'ShareMessages' }))
    }
  }, [displayShareMessagesScreen])
}
