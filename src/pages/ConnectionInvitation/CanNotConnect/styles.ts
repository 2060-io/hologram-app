import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 22,
      paddingHorizontal: 8,
    },
    text: {
      flex: 1,
      marginLeft: 6,
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
    },
  })

export default styles
