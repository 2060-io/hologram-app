import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      marginTop: 16,
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.sm,
      letterSpacing: 1,
      marginBottom: 6,
    },
    schema: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
      marginBottom: 8,
    },
    verdict: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      marginRight: 10,
    },
    text: {
      flex: 1,
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
    },
    retry: {
      marginTop: 8,
      textDecorationLine: 'underline',
    },
  })

export default styles
