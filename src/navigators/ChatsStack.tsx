import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import React, { useLayoutEffect } from 'react'

import getStyles from './styles'

import { useUnreadChatThreads } from '@2060/hooks/agent'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import Chats from '@2060/pages/Chats'
import { HomeMainTabParams } from '@2060/pages/HomeMain/HomeMainProps'
import SubChats from '@2060/pages/SubChats'
import { getGlobalStyles } from '@2060/styles'

type ChatsStackParams = {
  ChatsMain: undefined
  SubChats: { chatThreadId: string }
}

const Stack = createStackNavigator<ChatsStackParams>()
interface Props extends BottomTabScreenProps<HomeMainTabParams, 'Chats'> {}

export const ChatsStack = ({ navigation }: Props) => {
  const unreadThreads = useUnreadChatThreads()
  const numberUnreadChats = unreadThreads.length
  const tabBarBadge = numberUnreadChats || undefined
  const theme = useTheme()
  const globalStyles = getGlobalStyles(theme)
  const styles = getStyles(theme)

  const handleChangeHeaderOptions = () => {
    navigation.setOptions({ tabBarBadge, tabBarBadgeStyle: styles.tabBarBadgeStyle })
  }

  useLayoutEffect(handleChangeHeaderOptions, [tabBarBadge])

  return (
    <Stack.Navigator
      initialRouteName="ChatsMain"
      screenOptions={() => ({
        headerStyle: globalStyles.headerStyle,
        headerTitleAlign: 'center',
        headerShadowVisible: true,
        cardStyle: styles.cardStyle,
      })}
    >
      <Stack.Screen name="ChatsMain" component={Chats} />
      <Stack.Screen name="SubChats" component={SubChats} />
    </Stack.Navigator>
  )
}
