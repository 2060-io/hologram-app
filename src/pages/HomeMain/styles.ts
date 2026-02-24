import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles/types'
import { heightPercentageToDP } from '@src/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    tabBarStyle: {
      height: heightPercentageToDP('8.64%'),
      backgroundColor: theme.colors.primary,
      borderTopWidth: 0,
      elevation: 0,
      borderColor: 'transparent',
      shadowColor: 'transparent',
    },
    tabBarLabelStyle: {
      fontSize: theme.fontSize.sm - 1,
      fontFamily: 'EuclidCircularA-Medium',
    },
    tabBarItemStyle: {
      flexGrow: 1,
      height: heightPercentageToDP('8.64%'),
    },
    headerStyle: {
      backgroundColor: theme.colors.secondary,
    },
  })

export default styles
