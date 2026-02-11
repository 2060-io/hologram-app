import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      padding: 15,
    },
    headerLeft: {
      paddingLeft: 15,
    },
    headerRight: {
      paddingRight: 15,
    },
    headerText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    passwordsContainer: {
      paddingTop: 45,
    },
    title: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.tertiaryText,
      textAlign: 'center',
      marginBottom: 16,
    },
    titleRetypePass: {
      marginBottom: 10,
    },
    suggestion: {
      fontSize: theme.fontSize.md,
      color: theme.colors.secondaryText,
      textAlign: 'center',
      marginBottom: 16,
    },
    successUpdated: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      alignItems: 'center',
      marginBottom: 28,
    },
    verifiedIconContainer: {
      width: widthPercentageToDP('15%'),
      height: widthPercentageToDP('15%'),
      borderRadius: widthPercentageToDP('15%') / 2,
      marginTop: 10,
      marginBottom: 20,
    },
  })
