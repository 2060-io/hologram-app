import { ParamListBase, StackActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { usePushNotifications } from '@src/hooks/providers/PushNotificationsProvider'
import { useSharedDataFromOtherApps } from '@src/hooks/providers/SharedDataFromOtherAppsProvider'
import {
  markNewConnectionNotificationAsViewed,
  markNotificationsOfChatAsViewed,
} from '@src/utils/pushNotificationsUtils'
import { useEffect } from 'react'

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
            })
          )
        }
        if (pushNotification.screen === 'Chat') {
          markNotificationsOfChatAsViewed(pushNotification.params?.connectionId as string)
          const currentScreenParams = navigation.getState().routes.at(-1)?.params as {
            screen?: string
            params?: Record<string, unknown>
          }
          const isChatCurrentScreen = currentScreenParams?.screen === 'Chat'
          if (isChatCurrentScreen) {
            const isUserInTheChatOfTheNotification =
              currentScreenParams?.params?.chatThreadId === pushNotification.params?.chatThreadId
            if (!isUserInTheChatOfTheNotification) {
              navigation.dispatch(
                StackActions.replace('ChatStack', {
                  screen: 'Chat',
                  params: { chatThreadId: pushNotification.params?.chatThreadId },
                })
              )
            }
          } else {
            navigation.dispatch(
              StackActions.push('ChatStack', {
                screen: 'Chat',
                params: { chatThreadId: pushNotification.params?.chatThreadId },
              })
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
      navigation.dispatch(StackActions.push('ChatStack', { screen: 'ShareMessages' }))
    }
  }, [displayShareMessagesScreen])
}
