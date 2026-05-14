import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    headerRight: {
      paddingRight: 15,
    },
    headerRightText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
  })
