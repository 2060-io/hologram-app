import { ConnectionEventTypes, ConnectionStateChangedEvent } from '@credo-ts/core'
import notifee from '@notifee/react-native'
import { t } from 'i18next'

import { MobileAgent } from '@2060/services/agent'
import { getConnectionDisplayName } from '@2060/utils/connectionUtils'
import {
  createChannel,
  LOCAL_NOTIFICATION_ID_PREFIX,
  optionsNotificationsIOS,
  optionsNotificationAndroid,
} from '@2060/utils/pushNotificationsUtils'

export const manageConnectionStateChangedEvent = (agent: MobileAgent) => {
  const connectionsListener = async (data: ConnectionStateChangedEvent) => {
    const connection = data.payload.connectionRecord
    if (connection.isReady) {
      const channelId = await createChannel()

      const newNotification = {
        id: `${LOCAL_NOTIFICATION_ID_PREFIX}-connection-${connection.id}`,
        title: t('connection.newConnection'),
        body: `${t('connection.youAreNowConnectedTo')} ${getConnectionDisplayName(connection)}`,
        data: {
          screen: 'ConnectionDetails',
          params: { connectionId: connection?.id },
        },
        android: optionsNotificationAndroid({ channelId }),
        ios: optionsNotificationsIOS(),
      }
      notifee.displayNotification(newNotification)
      notifee.incrementBadgeCount()
    }
  }

  const addConnectionChangeListener = () => {
    agent.events.on<ConnectionStateChangedEvent>(
      ConnectionEventTypes.ConnectionStateChanged,
      connectionsListener,
    )
  }

  const removeConnectionChangeListener = () => {
    agent.events.off<ConnectionStateChangedEvent>(
      ConnectionEventTypes.ConnectionStateChanged,
      connectionsListener,
    )
  }

  return {
    addConnectionChangeListener,
    removeConnectionChangeListener,
  }
}
