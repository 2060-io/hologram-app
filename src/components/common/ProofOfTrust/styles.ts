import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      alignItems: 'center',
      marginTop: 22,
      paddingBottom: 36,
    },
    title: {
      fontSize: theme.fontSize.md + 1,
      color: theme.colors.primaryText,
      textAlign: 'center',
      marginBottom: 28,
    },
    proofItemContainer: {
      width: '100%',
      alignItems: 'center',
    },
    proofItemSubContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    entityName: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      textAlign: 'center',
      marginLeft: 4,
      marginRight: 7,
    },
    flagEmoji: {
      fontSize: 12,
    },
    notVerifiableIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginBottom: 10,
    },
    notVerifiable: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    separator: {
      color: theme.colors.green,
    },
    loadingSkeletonSeparator: {
      marginBottom: 10,
    },
  })
