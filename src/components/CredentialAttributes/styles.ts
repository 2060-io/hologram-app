import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    title: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
      marginVertical: 15,
    },
    sectionRowsContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      paddingBottom: 0,
    },
  })

export default styles
