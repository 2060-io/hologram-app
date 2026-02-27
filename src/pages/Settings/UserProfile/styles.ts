import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
    },
    headerBtnText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md2 + 1,
    },
    headerLeft: {
      paddingLeft: 14,
    },
    headerRight: {
      paddingRight: 14,
    },
  })
