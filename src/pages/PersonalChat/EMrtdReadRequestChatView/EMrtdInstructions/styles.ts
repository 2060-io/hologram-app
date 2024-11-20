import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    subContainer: {
      flex: 1,
      padding: 12,
      paddingBottom: 20,
    },
    flex1: {
      flex: 1,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md2,
      marginLeft: 8,
    },
    note: {
      color: theme.colors.red,
      fontSize: theme.fontSize.md2,
      marginVertical: 14,
    },
    instructions: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
    },
    instructionsGreen: {
      fontSize: theme.fontSize.md,
      color: theme.colors.green,
    },
    imageContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    refuseText: {
      color: theme.colors.blue,
      textAlign: 'center',
      fontSize: theme.fontSize.md2,
      marginTop: 12,
    },
  })
