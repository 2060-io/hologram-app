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
    },
    buttonsContainer: {
      flexDirection: 'row',
    },
    notifyButton: {
      marginTop: 8,
    },
    notifiedContainer: {
      marginTop: 8,
      opacity: 0.5,
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
    refusedContainer: {
      backgroundColor: hexTransparency(theme.colors.red, theme.isDarkMode ? '2E' : '33'),
    },
    refusedText: {
      color: theme.colors.red,
      fontSize: theme.fontSize.md - 1,
    },
    credentialAttributesContainer: {
      marginTop: 9,
      marginBottom: 5,
    },
    credentialAttributeContainer: {
      alignSelf: 'flex-start',
      backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginBottom: 5,
      borderRadius: 15,
    },
    credentialAttribute: {
      color: theme.colors.blue,
      fontSize: theme.fontSize.md - 1,
    },
  })
