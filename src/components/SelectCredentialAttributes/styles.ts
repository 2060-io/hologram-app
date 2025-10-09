import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles, headerHeight } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
    },
    cancelContainer: {
      height: headerHeight,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
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
      padding: 12,
    },
    title: {
      color: theme.colors.primaryText,
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
