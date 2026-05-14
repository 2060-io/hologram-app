import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { StyleSheet } from 'react-native'

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
    commonText: {
      color: theme.colors.primaryText,
      textAlign: 'center',
      fontSize: theme.fontSize.md2,
      marginBottom: 10,
    },
    subContainerScannedOrExpired: {
      flex: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    containerButtonScannedOrExpired: {
      flex: 2,
      justifyContent: 'center',
    },
    timeoutWaitingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeoutWaitingIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 32,
      backgroundColor: 'red',
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
