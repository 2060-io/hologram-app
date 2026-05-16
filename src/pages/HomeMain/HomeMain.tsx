import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { PlatformPressable } from '@react-navigation/elements'
import { HeaderTitle, SvgIcon } from '@src/components/common'
import { IconsNames } from '@src/components/common/SvgIcon'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { ChatsStack } from '@src/navigators/ChatsStack'
import { AppTheme, getGlobalStyles } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Scan from '../Scan'
import { Settings } from '../Settings'
import Wallet from '../Wallet'
import HomeMainContainer from './HomeMainContainer'
import { HomeMainTabParams, HomeTabProps } from './HomeMainProps'
import getStyles from './styles'
import { useHomeMain } from './useHomeMain'

type TabBarIconProps = {
  routeName: keyof HomeMainTabParams
  focused: boolean
  theme: AppTheme
}

const headerTitles: Partial<Record<keyof HomeMainTabParams, string>> = {
  Scan: 'scan.scanner',
  Wallet: 'general.credentials',
}

const TabBarIcon = ({ routeName, focused, theme }: TabBarIconProps) => {
  const fillColor = focused ? theme.colors.green : theme.isDarkMode ? '#787878' : '#B2BEC2'
  const size = 19
  const iconName: Record<keyof HomeMainTabParams, keyof IconsNames> = {
    Chats: 'messages',
    Wallet: 'wallet',
    Scan: 'scan',
    Settings: 'settings',
  }
  return <SvgIcon name={iconName[routeName]} width={size} height={size} fill={fillColor} />
}

const Tab = createBottomTabNavigator<HomeMainTabParams>()

const HomeMain = (props: HomeTabProps) => {
  const { navigation } = props
  const theme = useTheme()
  const { t } = useTranslation()
  const styles = getStyles(theme)
  const globalStyles = getGlobalStyles(theme)

  useHomeMain({ navigation })

  return (
    <Tab.Navigator
      key="tab_navigator_home"
      initialRouteName="Chats"
      screenOptions={({ route }) => ({
        tabBarLabel: t(`navigation.${route.name}`),
        tabBarAccessibilityLabel: 'icon',
        tabBarAllowFontScaling: true,
        tabBarStyle: styles.tabBarStyle,
        tabBarInactiveTintColor: hexTransparency(theme.colors.primaryText, '4D'),
        tabBarActiveTintColor: theme.colors.primaryText,
        tabBarLabelStyle: styles.tabBarLabelStyle,
        tabBarItemStyle: styles.tabBarItemStyle,
        headerStyle: globalStyles.headerStyle,
        headerTitleAlign: 'center',
        headerTitle: () => (
          <HeaderTitle title={t(headerTitles[route.name] ?? `navigation.${route.name}`)} theme={theme} />
        ),
        tabBarIcon: (iconProps) => <TabBarIcon {...iconProps} routeName={route.name} theme={theme} />,
        tabBarButton: (buttonProps) => <PlatformPressable {...buttonProps} android_ripple={{ color: 'transparent' }} />,
      })}
    >
      <Tab.Screen name="Chats" component={ChatsStack} options={{ headerShown: false }} />
      <Tab.Screen name="Scan" component={Scan} />
      <Tab.Screen name="Wallet" component={Wallet} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  )
}

export default HomeMainContainer(HomeMain)
