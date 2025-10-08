import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    title: {
      marginTop: 12,
      textAlign: 'center',
      color: theme.colors.tertiaryText,
    },
  })
