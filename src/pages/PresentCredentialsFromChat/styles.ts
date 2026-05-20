import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      marginTop: 12,
      textAlign: 'center',
      color: theme.colors.tertiaryText,
    },
  })
