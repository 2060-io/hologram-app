import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    responseMsg: {
      marginBottom: theme.edges.messageMargin,
      marginRight: theme.edges.messageMargin,
      textAlign: 'right',
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
  })
