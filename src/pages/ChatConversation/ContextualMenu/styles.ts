import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerActionsMenu: {
      width: widthPercentageToDP('92%'),
      alignSelf: 'center',
      marginTop: 9,
    },
    containerAction: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 23,
      paddingVertical: 13,
    },
    actionText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
    },
    containerActionHeader: {
      flexShrink: 1,
      marginLeft: 21.5,
    },
    actionTitle: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.xl,
    },
    actionDescription: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md2,
      lineHeight: 22,
    },
    containerMenuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15.5,
    },
    containerOptionCard: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.white,
      padding: 0,
      marginBottom: 10,
    },
    image: {
      width: widthPercentageToDP('16%'),
      height: widthPercentageToDP('16%'),
      borderRadius: widthPercentageToDP('16%') / 2,
      resizeMode: 'contain',
    },
  })
