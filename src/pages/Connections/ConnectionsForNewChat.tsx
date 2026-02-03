import { useHeaderHeight } from '@react-navigation/elements'
import { StackActions } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity } from 'react-native'

import { Connections } from '@2060/components'
import { ConnectionItem } from '@2060/components/Connections/ConnectionsList'
import { NavigationStackParams } from '@2060/components/Navigation/NavigationProps'
import { Text } from '@2060/components/common'
import { IS_IOS } from '@2060/constants'
import { useChats, useConnections } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { AppTheme } from '@2060/styles'

interface Props extends StackScreenProps<NavigationStackParams, 'ConnectionsForNewChat'> {}

const ConnectionsForNewChat = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { findOrCreateThread } = useChats()
  const { connections } = useConnections()
  const headerHeight = useHeaderHeight()

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
    <Connections
      navigation={navigation}
      onPressConnection={tryGoToChatScreen}
      headerProps={{
        presentation: 'modal',
        height: IS_IOS ? 60 : headerHeight,
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
