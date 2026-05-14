import { AppTheme, cardShadowStyles } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerSecurityMessage: {
      ...cardShadowStyles(theme.colors),
      width: widthPercentageToDP('84.81%'),
      paddingVertical: 4,
      paddingHorizontal: theme.edges.messageMargin,
      backgroundColor: theme.isDarkMode ? '#182022' : '#E8F0F2',
      alignSelf: 'center',
      borderRadius: 4,
      marginBottom: 13,
    },
    textMessage: {
      color: theme.isDarkMode ? theme.colors.lightGrey : '#6A8994',
      fontSize: theme.fontSize.sm + 2,
    },
    textMessageForService: {
      color: theme.isDarkMode ? theme.colors.lightGrey : '#6A8994',
      fontSize: theme.fontSize.sm + 2,
      marginBottom: 12,
    },
    disclaimer: {
      color: theme.colors.red,
      fontSize: theme.fontSize.sm + 2,
    },
    underLineText: {
      textDecorationLine: 'underline',
    },
  })
