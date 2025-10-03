import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerRoot: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
    },
    containerContent: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: heightPercentageToDP('4%'),
      paddingBottom: heightPercentageToDP('2%'),
    },
    btnDone: {
      paddingRight: 12,
    },
    btnDoneText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md2 + 1,
    },
    displayName: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.primaryText,
      paddingBottom: heightPercentageToDP('3%'),
      paddingTop: heightPercentageToDP('2%'),
      textTransform: 'capitalize',
    },
    containerCardQR: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: widthPercentageToDP('75%'),
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.white,
      marginBottom: heightPercentageToDP('5%'),
    },
    containerBtnShare: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.green,
      borderRadius: 23,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 12,
      width: widthPercentageToDP('92%'),
    },
    btnShareText: {
      fontSize: theme.fontSize.md2 + 1,
      color: theme.colors.white,
      textAlign: 'center',
      paddingLeft: 17,
    },
  })
