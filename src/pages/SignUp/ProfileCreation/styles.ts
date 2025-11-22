import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 20,
    },
    containerBtn: {
      marginTop: 20,
    },
    btnDisabled: {
      backgroundColor: theme.colors.grey,
    },
    title: {
      fontSize: theme.fontSize.xl + 3,
      color: theme.colors.primaryText,
      marginTop: 12,
      textAlign: 'center',
    },
  })
