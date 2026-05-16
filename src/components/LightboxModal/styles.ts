import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    headerContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    contentContainer: {
      flex: 1,
    },
  })
