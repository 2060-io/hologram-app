import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@src/styles'
import { waterColor } from '@src/utils/colorUtils'
import { heightPercentageToDP } from '@src/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      margin: 15,
    },
    title: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
    },
    subTitle: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.tertiaryText,
      marginBottom: 12,
    },
    optionsContainer: {
      margin: 15,
      marginBottom: 0,
    },
    timeoutOptionsTitle: {
      marginBottom: 12,
      textAlign: 'center',
    },
    screenLockOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.white,
      padding: 0,
      height: heightPercentageToDP('5.8%'),
      marginBottom: 8,
    },
    optionSelected: {
      backgroundColor: waterColor(theme.colors.green),
      borderWidth: 1,
      borderColor: theme.colors.green,
    },
    option: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
    },
    automaticMediaDownloadTitle: {
      marginVertical: 12,
    },
  })
