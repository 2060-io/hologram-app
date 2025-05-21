import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerMain: {
      width: widthPercentageToDP('75%'),
      paddingHorizontal: theme.edges.messageMargin,
      marginBottom: theme.edges.messageMargin,
    },
    containerInfo: {
      alignSelf: 'center',
      marginBottom: 12,
      marginTop: 20,
    },
    label: {
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.xl,
      textAlign: 'center',
    },
    subTitle: {
      textAlign: 'center',
      alignSelf: 'center',
      color: theme.colors.blue,
      fontSize: theme.fontSize.sm + 2,
      lineHeight: 18,
    },
    textSemiBold: {
      fontSize: theme.fontSize.sm + 2,
    },
    containerVerifiedMark: {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1,
    },
    containerAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 11,
    },
    footerContainer: {
      marginTop: 18,
    },
    acceptedContainer: {
      borderRadius: 10,
      padding: 4,
      alignItems: 'center',
      backgroundColor: hexTransparency(theme.colors.green, theme.isDarkMode ? '2E' : '40'),
    },
    acceptedText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md - 1,
    },
    connectionRefusedByAgeText: {
      marginTop: 4,
      fontSize: theme.fontSize.sm,
      color: theme.colors.primaryText,
    },
  })
