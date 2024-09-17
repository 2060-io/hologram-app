import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 33,
      backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.primary,
      borderWidth: 0.5,
      borderColor: theme.isDarkMode ? theme.colors.primary : theme.colors.grey,
    },
    floatBox: {
      alignItems: 'center',
    },
    emojiBox: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconEllipsis: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.secondary,
    },
  })
