import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: widthPercentageToDP('75%'),
    },
    subContainer: {
      margin: theme.edges.messageMargin,
    },
    title: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.blue,
      marginBottom: 8,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
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
    footerContainer: {
      marginTop: theme.edges.messageMargin,
    },
    credential: {
      marginBottom: theme.edges.messageMargin,
    },
    lastCredential: {
      marginBottom: 0,
    },
  })
