import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    containerBtn: {
      marginTop: 20,
    },
    btnDisabled: {
      backgroundColor: theme.colors.grey,
    },
    appLogoContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    title: {
      fontSize: theme.fontSize.xl + 3,
      color: theme.colors.primaryText,
      marginTop: 12,
      textAlign: 'center',
    },
  })
