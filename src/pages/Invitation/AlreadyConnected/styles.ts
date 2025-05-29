import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    alreadyConnectedContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      marginBottom: 20,
    },
    alreadyConnectedText: {
      flex: 1,
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
      textAlign: 'center',
      marginBottom: 6,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    actionContainer: {
      alignItems: 'center',
    },
    actionText: {
      flex: 1,
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
      marginTop: 2,
    },
  })
