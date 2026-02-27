import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { waterColor } from '@src/utils/colorUtils'
import { heightPercentageToDP } from '@src/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      padding: 15,
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    customDevEnvValue: {
      flex: 1,
      marginRight: 4,
    },
    devEnvsModalContainer: {
      margin: 15,
      marginBottom: 0,
    },
    title: {
      textAlign: 'center',
      fontSize: theme.fontSize.lg,
      marginTop: 20,
      marginBottom: 10,
      color: theme.colors.primaryText,
    },
    textInput: {
      flex: 1,
      height: 40,
      backgroundColor: theme.colors.grey,
      fontFamily: 'EuclidCircularA-Medium',
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.md2,
      paddingHorizontal: 14,
      borderRadius: 10,
      marginRight: 4,
      borderColor: theme.colors.primaryText,
      borderWidth: 0.25,
    },
    textButton: {
      textAlign: 'center',
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
    },
    editionCustomDevEnvContainer: {
      marginBottom: 12,
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
    },
    createCustomDenEnvText: {
      marginTop: 10,
      marginBottom: 20,
    },
    devEnvText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
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
  })
