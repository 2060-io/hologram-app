import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    textMessageLoader: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
      marginBottom: 10,
    },
  })
