import { StyleSheet } from 'react-native'

import { headerHeight } from './Header/styles'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    containerStickyDate: {
      position: 'absolute',
      zIndex: 1,
      top: headerHeight,
      alignSelf: 'center',
      backgroundColor: theme.isDarkMode ? '#182022' : '#E8F0F2',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 4,
    },
    stickyDateText: {
      fontSize: theme.fontSize.sm + 1.84,
      color: theme.isDarkMode ? '#B8D2D9' : '#6A8994',
      textAlign: 'center',
      textTransform: 'capitalize',
    },
  })
