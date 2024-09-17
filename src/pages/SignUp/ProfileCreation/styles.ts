import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    containerBtn: {
      marginTop: 40,
    },
    btnDisabled: {
      backgroundColor: theme.colors.grey,
    },
  })
