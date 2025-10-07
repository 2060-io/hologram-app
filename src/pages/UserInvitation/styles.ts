import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerRoot: {
      flex: 1,
    },
    containerContent: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 14,
      marginHorizontal: 12,
    },
    btnDone: {
      paddingLeft: 15,
    },
    btnRefresh: {
      paddingRight: 15,
    },
    headerText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md2,
    },
    displayName: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.primaryText,
      textTransform: 'capitalize',
    },
    containerCardQR: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: '75%',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.white,
      marginBottom: 8,
    },
    pressRefreshText: {
      textAlign: 'center',
    },
    containerBtnShare: {
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.colors.green,
      borderRadius: 23,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: 12,
      width: '100%',
    },
    btnShareText: {
      fontSize: theme.fontSize.md2 + 1,
      color: theme.colors.white,
      textAlign: 'center',
      paddingLeft: 17,
    },
  })
