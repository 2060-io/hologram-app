import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@src/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      marginTop: 15,
      paddingHorizontal: 15,
    },
    btnRefuse: {
      paddingLeft: widthPercentageToDP('4%'),
    },
    btnAccept: {
      paddingRight: widthPercentageToDP('4%'),
    },
    card: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      alignItems: 'center',
      marginBottom: 22,
    },
    invitationLabel: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      marginTop: heightPercentageToDP('1.62%'),
      marginBottom: heightPercentageToDP('3.24%'),
      textAlign: 'center',
    },
    content: {
      fontSize: theme.fontSize.md + 1,
      color: theme.colors.primaryText,
      paddingTop: 14,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2 + 1.12,
      color: theme.colors.green,
    },
    fontFamilyBold: {
      fontSize: theme.fontSize.md + 1,
    },
    enabledChannelsText: {
      fontSize: theme.fontSize.md + 1,
      color: theme.colors.primaryText,
    },
    separator: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.secondary,
      marginTop: heightPercentageToDP('1.8%'),
      marginBottom: heightPercentageToDP('1.40%'),
    },
  })

export default styles
