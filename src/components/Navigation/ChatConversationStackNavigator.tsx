import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SvgIcon, HeaderTitle } from '../common'

import { ChatConversationStackParams } from './NavigationProps'
import getStyles from './styles'

import { ChatConversationProvider } from '@2060/hooks/agent'
import { MediaPlayerProvider } from '@2060/hooks/providers'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatConversation, MessageDetails, ForwardMessages, ShareMessages, MRZScanner } from '@2060/pages'
import { getGlobalStyles } from '@2060/styles'

const ChatConversationStack = createStackNavigator<ChatConversationStackParams>()
const ChatConversationStackNavigator = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)

  return (
    <ChatConversationProvider>
      <MediaPlayerProvider>
        <ChatConversationStack.Navigator
          key="stack_navigator_personal_chat"
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
          <ChatConversationStack.Group>
            <ChatConversationStack.Screen
              name="ChatConversation"
              component={ChatConversation}
              options={{ headerShown: false }}
            />
            <ChatConversationStack.Screen name="MessageDetails" component={MessageDetails} />
            <ChatConversationStack.Screen name="ForwardMessages" component={ForwardMessages} />
            <ChatConversationStack.Screen name="ShareMessages" component={ShareMessages} />
            <ChatConversationStack.Screen
              name="MRZScanner"
              component={MRZScanner}
              options={{ presentation: 'modal', headerShown: false }}
            />
          </ChatConversationStack.Group>
        </ChatConversationStack.Navigator>
      </MediaPlayerProvider>
    </ChatConversationProvider>
  )
}

export default ChatConversationStackNavigator
