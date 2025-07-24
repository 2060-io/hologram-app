import { StyleSheet } from 'react-native'

import { AppTheme, AppColors } from './types'

import { IS_IOS } from '@2060/constants'
import { hexTransparency } from '@2060/utils/colorUtils'
import { heightPercentageToDP } from '@2060/utils/responsiveUtils'

export const getGlobalStyles = (theme: AppTheme) =>
  StyleSheet.create({
    headerTitleStyle: {
      fontSize: theme.fontSize.lg + 1.26,
      color: theme.colors.primaryText,
    },
    headerStyle: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      borderBottomWidth: 0,
      borderColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0,
      shadowColor: 'transparent',
      height: heightPercentageToDP(IS_IOS ? '12.10%' : '7.48%'),
    },
  })

export const cardStyles = (theme: AppTheme) => ({
  backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.primary,
  borderRadius: 9,
  padding: 15,
})

export const cardShadowStyles = (colors: AppColors) => ({
  shadowColor: hexTransparency(colors.black, '1A'),
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.22,
  shadowRadius: 2.22,
  elevation: 3,
})
