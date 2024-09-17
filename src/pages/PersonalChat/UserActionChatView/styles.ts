import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    responseMsg: {
      paddingTop: 8,
      paddingBottom: 5,
      paddingRight: 8,
      paddingLeft: 12,
      textAlign: 'right',
      color: theme.colors.blue,
      fontSize: theme.fontSize.md + 1,
      textTransform: 'none',
    },
  })
