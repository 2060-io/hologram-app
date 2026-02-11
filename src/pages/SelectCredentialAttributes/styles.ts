import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    cancelContainer: {
      marginVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 12,
    },
    cancelText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
      marginRight: 14,
    },
    subContainer: {
      paddingHorizontal: 12,
      marginTop: 12,
      marginBottom: 6,
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
    selectAllText: {
      marginTop: 20,
      width: '50%',
      textDecorationLine: 'underline',
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.md2,
    },
    attributesSectionTitle: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
      marginVertical: 15,
    },
    credentialAttributeContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      marginBottom: 8,
      padding: 12,
    },
    selectedCredentialAttribute: {
      borderWidth: 1.4,
      borderColor: theme.colors.green,
    },
    generateQRButton: {
      marginTop: 4,
      marginBottom: 8,
    },
    presentEnabled: {
      opacity: 1,
    },
    presentDisabled: {
      opacity: 0.5,
    },
  })

export default styles
