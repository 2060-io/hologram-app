import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerReply: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
      borderLeftWidth: 8.56,
      borderLeftColor: theme.colors.green,
      padding: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    containerInfoUser: {
      flexShrink: 1,
      flexGrow: 1,
      paddingRight: 4.28,
    },
    replyTo: {
      fontSize: theme.fontSize.sm + 1.84,
      color: theme.colors.green,
    },
    containerPreview: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    replyMsg: {
      fontSize: theme.fontSize.sm + 1.84,
      color: theme.isDarkMode ? theme.colors.tertiaryText : '#6A8994',
      marginRight: 8,
    },
    imgThumbnail: {
      width: widthPercentageToDP('14%'),
      height: undefined,
      aspectRatio: 1.6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    btnDismiss: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      width: widthPercentageToDP('7.13%'),
      height: widthPercentageToDP('7.13%'),
      borderRadius: widthPercentageToDP('7.13%') / 2,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginLeft: 4,
    },
  })
