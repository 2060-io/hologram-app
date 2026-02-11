import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles/types'
import { heightPercentageToDP, widthPercentageToDP } from '@src/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    cardStyle: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    tabBarBadgeStyle: {
      backgroundColor: theme.colors.red,
      borderColor: theme.colors.white,
      lineHeight: 13,
      width: widthPercentageToDP('5.4%'),
      height: heightPercentageToDP('1.85%'),
      borderRadius: 8.58,
      borderWidth: 1,
      color: theme.colors.white,
      fontFamily: 'EuclidCircularA-SemiBold',
      fontSize: theme.fontSize.sm - 1,
      left: 0,
      top: -3,
    },
  })

export default styles
