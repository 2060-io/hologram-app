import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
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
      paddingBottom: 12,
    },
    title: {
      color: theme.colors.primaryText,
    },
    selectAllText: {
      paddingTop: 12,
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
      borderWidth: 1.5,
      borderColor: theme.colors.green,
    },
    presentButton: {
      marginTop: 4,
    },
  })

export default styles
