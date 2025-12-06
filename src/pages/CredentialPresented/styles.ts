import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

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
