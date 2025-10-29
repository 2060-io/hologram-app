import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      paddingVertical: 15,
      paddingHorizontal: 15,
    },
    optionsContainer: {
      marginTop: 15,
    },
    titleIssuerInfo: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      marginTop: 20,
      marginBottom: 15,
    },
  })

export default styles
