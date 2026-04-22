import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity } from 'react-native'

import { Connections } from '@src/components'
import { ConnectionItem } from '@src/components/Connections/ConnectionList'
import { NavigationStackParams } from '@src/components/Navigation/NavigationProps'
import { Text } from '@src/components/common'
import { useChats, useConnections } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { AppTheme } from '@src/styles'

type Props = StackScreenProps<NavigationStackParams, 'ConnectionsForNewChat'>

const ConnectionsForNewChat = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { findOrCreateThread } = useChats()
  const { connections } = useConnections()

  const tryGoToChatScreen = useCallback((connectionItem: ConnectionItem) => {
    const connection = connections.find(conn => conn.id === connectionItem.id)
    if (!connection) return
    const chatThreadId = findOrCreateThread({ connection }).id
    goToChatScreen(chatThreadId)
  }, [])

  const goToChatScreen = (chatThreadId: string) => {
    navigation.dispatch(StackActions.push('ChatStack', { screen: 'Chat', params: { chatThreadId } }))
  }

  return (
    <Connections
      navigation={navigation}
      onPressConnection={tryGoToChatScreen}
      headerProps={{
        presentation: 'modal',
        height: 60,
        title: t('chat.newMessage'),
        titleForSubConnections: t('chat.newMessage'),
        defaultBackButton: (
          <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Text fontFamily="EuclidCircularA-Medium" style={styles.headerBtnText}>
              {t('general.cancel')}
            </Text>
          </TouchableOpacity>
        ),
      }}
    />
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    headerLeft: {
      paddingLeft: 15,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
  })
export default ConnectionsForNewChat
