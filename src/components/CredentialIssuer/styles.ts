import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    headerCenterContainer: {
      flex: 1,
      marginLeft: 10,
    },
    issuerName: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
    },
    containerIconValidity: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    didText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.tertiaryText,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
    },
    descriptionText: {
      marginVertical: 10,
    },
    alreadyConnectedText: {
      textAlign: 'center',
      marginVertical: 6,
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    starsContainer: {
      flexDirection: 'row',
    },
    star: {
      marginLeft: 2,
    },
    underLineText: {
      textDecorationLine: 'underline',
      marginRight: 6,
    },
    urlContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    button: {
      width: '100%',
      marginTop: 6,
    },
  })

export default styles
