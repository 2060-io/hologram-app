import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.grey,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    textInput: {
      flex: 1,
      fontFamily: 'EuclidCircularA-Medium',
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.md2,
      paddingVertical: 0,
    },
  })
