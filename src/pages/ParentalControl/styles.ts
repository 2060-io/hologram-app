import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      margin: 15,
    },
    birthdayContainer: {
      ...cardShadowStyles(theme.colors),
      backgroundColor: theme.isDarkMode ? theme.colors.secondaryGrey : theme.colors.grey,
      padding: 6,
      paddingHorizontal: 10,
      borderRadius: 9,
    },
    birthdayText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
    },
    parentalControlMessage: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
      marginBottom: 16,
    },
  })
