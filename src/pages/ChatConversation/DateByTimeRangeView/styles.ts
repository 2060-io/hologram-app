import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerDay: {
      alignSelf: 'center',
      backgroundColor: theme.isDarkMode ? '#182022' : '#E8F0F2',
      borderRadius: 4,
      marginBottom: 12.84,
      marginTop: 4.27,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    textDay: {
      fontSize: theme.fontSize.sm + 1.84,
      color: theme.isDarkMode ? '#B8D2D9' : '#6A8994',
      textAlign: 'center',
      textTransform: 'capitalize',
    },
  })
