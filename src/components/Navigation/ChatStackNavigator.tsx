import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SvgIcon, HeaderTitle } from '../common'

import { ChatStackParams } from './NavigationProps'
import getStyles from './styles'

import { ChatProvider } from '@2060/hooks/agent'
import { MediaPlayerProvider } from '@2060/hooks/providers'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { Chat, MessageDetails, ForwardMessages, ShareMessages, MRZScanner } from '@2060/pages'
import { getGlobalStyles } from '@2060/styles'

const ChatStack = createStackNavigator<ChatStackParams>()
const ChatStackNavigator = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)

  return (
    <ChatProvider>
      <MediaPlayerProvider>
        <ChatStack.Navigator
          key="stack_navigator_chat"
          screenOptions={({ route }) => ({
            cardStyle: styles.cardStyle,
            headerStyle: globalStyles.headerStyle,
            headerBackTitle: '',
            headerBackAllowFontScaling: true,
            headerTitleAlign: 'center',
            headerTitle: () => <HeaderTitle title={t(`navigation.${route.name}`)} theme={theme} />,
            headerBackImage: () => (
              <View style={styles.containerIconBakc}>
                <SvgIcon name="arrowLeft" width={18} height={18} fill={theme.colors.primaryText} />
              </View>
            ),
          })}
        >
          <ChatStack.Group>
            <ChatStack.Screen name="Chat" component={Chat} options={{ headerShown: false }} />
            <ChatStack.Screen name="MessageDetails" component={MessageDetails} />
            <ChatStack.Screen name="ForwardMessages" component={ForwardMessages} />
            <ChatStack.Screen name="ShareMessages" component={ShareMessages} />
            <ChatStack.Screen
              name="MRZScanner"
              component={MRZScanner}
              options={{ presentation: 'modal', headerShown: false }}
            />
          </ChatStack.Group>
        </ChatStack.Navigator>
      </MediaPlayerProvider>
    </ChatProvider>
  )
}

export default ChatStackNavigator
