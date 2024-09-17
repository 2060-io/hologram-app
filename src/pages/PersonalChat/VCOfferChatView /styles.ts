import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: widthPercentageToDP('75%'),
    },
    subContainer: {
      margin: 8,
      marginBottom: 0,
    },
    title: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.blue,
      marginBottom: 8,
    },
    credentialMainInfoContainer: {
      marginBottom: 8,
    },
    buttonsContainer: {
      flexDirection: 'row',
    },
    refuseButton: {
      flex: 1,
      marginRight: 8,
    },
    acceptButton: {
      flex: 1,
    },
    baseFooterContainer: {
      borderRadius: 10,
      padding: 4,
      alignItems: 'center',
    },
    acceptingContainer: {
      backgroundColor: theme.colors.blue,
    },
    acceptingText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md - 1,
    },
    refusedContainer: {
      backgroundColor: hexTransparency(theme.colors.red, theme.isDarkMode ? '2E' : '33'),
    },
    refusedText: {
      color: theme.colors.red,
      fontSize: theme.fontSize.md - 1,
    },
    acceptedContainer: {
      backgroundColor: hexTransparency(theme.colors.green, theme.isDarkMode ? '2E' : '40'),
    },
    acceptedText: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md - 1,
    },
  })
