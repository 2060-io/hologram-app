import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    containerOpeningWallet: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    cardStyle: {
      backgroundColor: theme.colors.secondary,
    },
    containerIconBakc: {
      paddingLeft: 15,
    },
  })
