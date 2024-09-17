import { StyleSheet } from 'react-native'

import { waterColor } from '@2060/constants'
import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'
import { heightPercentageToDP } from '@2060/utils/responsiveUtils'

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
    devEnvsModalContainer: {
      margin: 15,
    },
    title: {
      textAlign: 'center',
      fontSize: theme.fontSize.lg,
      marginVertical: 10,
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
      marginBottom: 8.56,
    },
    optionSelected: {
      backgroundColor: waterColor(theme.colors.green),
      borderWidth: 1,
      borderColor: theme.colors.green,
    },
  })
