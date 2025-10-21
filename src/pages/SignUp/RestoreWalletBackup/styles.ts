import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 35,
      alignItems: 'center',
    },
    headerLeft: {
      paddingLeft: 15,
    },
    headerLeftText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md2,
    },
    title: {
      textAlign: 'center',
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.xl,
    },
    recoveryPassText: {
      marginVertical: 16,
    },
    continueButton: {
      marginTop: 25,
    },
    errorButton: {
      marginTop: 40,
    },
    text: {
      color: theme.colors.darkGrey,
      fontSize: theme.fontSize.md2,
      textAlign: 'center',
    },
    errorTitle: {
      color: theme.colors.red,
      fontSize: 19,
    },
    pleaseWaitText: {
      textAlign: 'center',
      color: theme.colors.darkGrey,
      fontSize: theme.fontSize.lg,
    },
    card: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      marginTop: 20,
      marginBottom: 15,
    },
    downloadProgress: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      textAlign: 'center',
      marginBottom: 15,
    },
    errorSubContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorIconContainer: {
      backgroundColor: theme.colors.red,
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    errorTextContainer: {
      maxHeight: 150,
    },
    noCloudAvailable: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
      textAlign: 'center',
      marginBottom: 20,
    },
  })
