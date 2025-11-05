import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      paddingTop: 15,
      paddingHorizontal: 15,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    headerLeft: {
      paddingLeft: 15,
    },
    headerRight: {
      paddingRight: 15,
    },
    valuesNoRevealedYet: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      marginBottom: 10,
    },
  })
