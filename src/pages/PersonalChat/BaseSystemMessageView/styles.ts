import { StyleSheet } from 'react-native'

import { cardShadowStyles } from '../../../styles/globalStyles'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerMessage: {
      ...cardShadowStyles(theme.colors),
      backgroundColor: theme.isDarkMode ? '#182022' : '#E8F0F2',
      borderRadius: 4,
      width: widthPercentageToDP('80%'),
      alignItems: 'center',
      alignSelf: 'center',
      padding: 5,
      marginVertical: 10,
    },
    textMessage: {
      color: theme.isDarkMode ? theme.colors.lightGrey : '#6A8994',
      fontSize: theme.fontSize.sm + 2,
    },
  })
