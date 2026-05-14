import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
    },
  })

export default styles
