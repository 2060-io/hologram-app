import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 22,
    },
    text: {
      flex: 1,
      marginLeft: 6,
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
    },
  })

export default styles
