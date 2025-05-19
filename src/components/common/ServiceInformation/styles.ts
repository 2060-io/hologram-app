import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

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
      width: 30,
      height: 30,
      borderRadius: 15,
      marginVertical: 14,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    notEnoughAgeTextColor: {
      color: theme.colors.red,
    },
    underLineText: {
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
  })

export default styles
