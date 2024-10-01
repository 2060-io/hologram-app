import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
      justifyContent: 'center',
    },
  })

export default styles
