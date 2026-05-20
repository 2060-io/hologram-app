import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { useUnreadChatThreads } from '@src/hooks/agent'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import Chats from '@src/pages/Chats'
import { HomeMainTabParams } from '@src/pages/HomeMain/HomeMainProps'
import SubChats from '@src/pages/SubChats'
import { getGlobalStyles } from '@src/styles'
import React, { useLayoutEffect } from 'react'
import getStyles from './styles'

type ChatsStackParams = {
  ChatsMain: undefined
  SubChats: { chatThreadId: string }
}

const Stack = createStackNavigator<ChatsStackParams>()
type Props = BottomTabScreenProps<HomeMainTabParams, 'Chats'>

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
