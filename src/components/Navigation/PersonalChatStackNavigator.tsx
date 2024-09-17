import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SvgIcon, HeaderTitle } from '../common'

import { PersonalChatStackParams } from './NavigationProps'
import getStyles from './styles'

import { PersonalChatProvider } from '@2060/hooks/agent'
import { MediaPlayerProvider } from '@2060/hooks/agent/MediaPlayerProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { PersonalChat, MessageDetails, ForwardMessages, ShareMessages } from '@2060/pages'
import { getGlobalStyles } from '@2060/styles'

const PersonalChatStack = createStackNavigator<PersonalChatStackParams>()
const PersonalChatStackNavigator = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)
  return (
    <PersonalChatProvider>
      <MediaPlayerProvider>
        <PersonalChatStack.Navigator
          id="stack_navigator_personal_chat"
          screenOptions={({ route }) => ({
            cardStyle: styles.cardStyle,
            headerStyle: globalStyles.headerStyle,
            headerBackTitleVisible: false,
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
          <PersonalChatStack.Group>
            <PersonalChatStack.Screen
              name="PersonalChat"
              component={PersonalChat}
              options={{ headerShown: false }}
            />
            <PersonalChatStack.Screen name="MessageDetails" component={MessageDetails} />
            <PersonalChatStack.Screen name="ForwardMessages" component={ForwardMessages} />
            <PersonalChatStack.Screen name="ShareMessages" component={ShareMessages} />
          </PersonalChatStack.Group>
        </PersonalChatStack.Navigator>
      </MediaPlayerProvider>
    </PersonalChatProvider>
  )
}

export default PersonalChatStackNavigator
