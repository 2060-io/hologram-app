import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRight: {
      paddingRight: 15,
    },
    headerRightText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    containerCardQR: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: '75%',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.white,
      marginBottom: 14,
    },
    generatedContainer: {
      flex: 1,
      justifyContent: 'space-evenly',
    },
    generatedTitle: {
      textAlign: 'center',
      color: theme.colors.tertiaryText,
    },
    scannedText: {
      color: theme.colors.primaryText,
      textAlign: 'center',
      fontSize: theme.fontSize.md2,
      marginBottom: 10,
    },
    subContainerScanned: {
      flex: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButtonContainer: {
      flex: 2,
      justifyContent: 'center',
    },
  })
