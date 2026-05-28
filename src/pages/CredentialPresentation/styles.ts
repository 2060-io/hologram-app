import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

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
      fontSize: theme.fontSize.md + 1,
      color: theme.colors.green,
    },
    headerLeft: {
      width: 80,
      paddingLeft: 5,
    },
    headerRight: {
      width: 80,
      paddingRight: 5,
      alignItems: 'flex-end',
    },
    valuesNoRevealedYet: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
  })
