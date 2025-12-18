import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles/types'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginTop: 32,
      paddingHorizontal: theme.edges.messageMargin,
      marginBottom: 10,
      alignItems: 'center',
    },
    titleDelete: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.primaryText,
      textAlign: 'center',
      marginBottom: 7,
    },
    descriptionDelete: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.secondaryText,
      textAlign: 'center',
      marginBottom: 16,
      width: '80%',
    },
    button: {
      marginBottom: 10,
    },
  })

export default styles
