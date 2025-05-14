import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.isDarkMode ? 'rgba(74, 72, 72, 0.53) ' : 'rgba(0,0,0,0.53)',
    },
    contentContainer: {
      width: '85%',
      paddingHorizontal: 12,
      paddingVertical: 20,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      borderRadius: 8,
    },
    title: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.tertiaryText,
    },
    pinContainer: {
      flexDirection: 'row',
      marginTop: 30,
      gap: 12,
    },
    pin: {
      width: 26,
      height: 26,
      borderRadius: 13,
    },
    pinFilled: {
      backgroundColor: theme.colors.tertiaryText,
    },
    pinNotFilled: {
      borderWidth: 1,
      borderColor: theme.colors.tertiaryText,
    },
    dialPadContainer: {
      flexGrow: 0,
      marginTop: 12,
      marginBottom: 24,
    },
    footerText: {
      height: 65,
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
    },
    cancelButton: {
      alignSelf: 'flex-end',
    },
    cancelText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
  })
