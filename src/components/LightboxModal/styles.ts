import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

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
