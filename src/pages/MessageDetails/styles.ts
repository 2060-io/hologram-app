import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 15,
    },
    infoContainer: {
      width: '100%',
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      paddingTop: 0,
      paddingBottom: 11,
    },
    messageContainer: {
      alignSelf: 'center',
    },
    infoText: {
      color: theme.colors.blue,
      fontSize: theme.fontSize.md,
      marginBottom: 4,
    },
    sentByText: {
      marginVertical: 14,
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    senderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
    },
    senderText: {
      flex: 1,
      fontSize: theme.fontSize.md2 + 1.12,
      color: theme.colors.primaryText,
      paddingLeft: 12,
    },
  })
