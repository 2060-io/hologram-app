import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

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
      paddingLeft: 12,
    },
    btnAccept: {
      paddingRight: 12,
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
      marginTop: 12,
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
      marginBottom: 20,
    },
  })

export default styles
