import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    credentialCardContainer: {
      paddingHorizontal: 15,
    },
    title: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
      marginVertical: 15,
    },
    sectionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionRowsContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
    },
    sectionKey: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
      marginTop: 16,
      marginBottom: 8,
    },
    sectionValue: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md,
    },
    sectionKeyImage: {
      width: 40,
      height: 40,
      marginLeft: 10,
    },
    biggerImageContainer: {
      backgroundColor: 'rgba(0,0,0, 0.53)',
    },
    biggerImage: {
      width: '100%',
      height: '100%',
    },
  })

export default styles
