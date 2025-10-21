import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      padding: 15,
    },
    card: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      paddingVertical: 10,
      marginTop: 20,
      marginBottom: 24,
    },
    passwordDoesNotExistsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    makingBackupButton: {
      marginBottom: 16,
    },
    setPassText: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.tertiaryText,
      textAlign: 'center',
    },
    errorContainer: {
      marginTop: 10,
    },
    errorSubContainer: {
      marginBottom: 12,
      justifyContent: 'center',
    },
    errorIconContainer: {
      backgroundColor: theme.colors.red,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buildingContainer: {
      marginBottom: 15,
    },
    retryButton: {
      marginBottom: 10,
    },
    makePasswordText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
      textAlign: 'center',
      marginVertical: 12,
    },
    mediumText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
      paddingLeft: 12,
    },
    buildBackupText: {
      flex: 1,
      color: theme.colors.secondaryGrey,
    },
    errorTitle: {
      maxWidth: '80%',
      fontSize: theme.fontSize.lg,
      color: theme.colors.red,
      paddingLeft: 8,
      textAlign: 'center',
    },
  })
