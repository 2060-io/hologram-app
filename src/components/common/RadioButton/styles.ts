import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    radioButtonOutside: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.secondaryText,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioButtonInside: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.green,
    },
  })
