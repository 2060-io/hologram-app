import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    containerCardIssuerInfo: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      justifyContent: 'center',
      alignItems: 'center',
    },
    issuerName: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      paddingTop: 10,
      marginBottom: 14,
    },
    containerIconValidity: {
      marginVertical: 14,
    },
    iconValidity: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    notOldEnoughTextColor: {
      color: theme.colors.red,
    },
    underLineText: {
      paddingTop: 0.1,
      textDecorationLine: 'underline',
      marginRight: 6,
    },
    serviceProviderInfoContainer: {
      alignItems: 'center',
      marginTop: 18,
      marginBottom: 14,
    },
    serviceProviderName: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 18,
    },
    flagEmoji: {
      fontSize: 12,
      marginRight: 4,
    },
    termsAndConditionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 14,
    },
    privacyPolicyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    failedToFetchInfoText: {
      color: theme.colors.red,
      marginTop: 10,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
  })

export default styles
