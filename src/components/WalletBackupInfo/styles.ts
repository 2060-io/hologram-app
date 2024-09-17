import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    backupInfoContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      paddingTop: 20,
      width: '100%',
      alignItems: 'center',
    },
    iconContainer: {
      width: widthPercentageToDP('25%'),
      height: widthPercentageToDP('25%'),
      borderRadius: widthPercentageToDP('25%') / 2,
      backgroundColor: '#F5F7F8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    subContainer: {
      marginTop: 10,
    },
    mediumText: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.tertiaryText,
      textAlign: 'center',
    },
    smallText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
      textAlign: 'center',
    },
    suggestionText: {
      marginTop: 15,
    },
    reLoginButton: {
      width: '95%',
      marginTop: 6,
    },
  })
