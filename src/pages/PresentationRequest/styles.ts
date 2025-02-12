import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    subContainer: {
      marginTop: 15,
      paddingHorizontal: 15,
      paddingBottom: 40,
    },
    card: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
    },
    noCompatibleCredentialContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      marginVertical: 25,
      borderColor: theme.colors.red,
      borderWidth: 1.3,
    },
    sectionContainer: {
      marginTop: 10,
      paddingLeft: 25,
      paddingRight: 15,
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
    mainTitle: {
      marginVertical: 25,
    },
    submissionSectionTitle: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      marginBottom: 15,
    },
    credentialContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioButton: {
      marginRight: 15,
    },
    headerLeft: {
      marginLeft: 15,
    },
    headerRight: {
      marginRight: 15,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
  })

export default styles
