import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'

import BaseConnections from './BaseConnections'
import getStyles from './styles'

import { ConnectionItem } from '@2060/components/ConnectionsList/ConnectionListProps'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { useChats, useConnections } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'

interface Props extends StackScreenProps<NavigationStackParams, 'ConnectionsForNewChat'> {}

const ConnectionsForNewChat = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { findOrCreateThread } = useChats()
  const { records: connections } = useConnections()

  const tryGoToChatScreen = useCallback((connectionItem: ConnectionItem) => {
    const connection = connections.find(conn => conn.id === connectionItem.id)
    if (!connection) return
    const chatThreadId = findOrCreateThread({ connection }).id
    goToChatScreen(chatThreadId)
  }, [])

  const goToChatScreen = (chatThreadId: string) => {
    navigation.dispatch(
      StackActions.push('PersonalChatStack', { screen: 'PersonalChat', params: { chatThreadId } }),
    )
  }

  return (
    <BaseConnections
      navigation={navigation}
      onPressConnection={tryGoToChatScreen}
      headerProps={{
        presentation: 'modal',
        height: 60,
        title: t('chat.newMessage'),
        titleForSubConnections: t('chat.newMessage'),
        defaultBackButton: (
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Text typography="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
        ),
      }}
    />
  )
}

export default ConnectionsForNewChat
