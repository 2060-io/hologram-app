import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    containerCardQR: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: '75%',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.white,
      marginBottom: 14,
    },
    errorCreatingText: {
      color: theme.colors.red,
      fontSize: theme.fontSize.md,
    },
  })
