import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    display: {
      display: 'flex',
    },
    hide: {
      display: 'none',
    },
    takenPhotoContainer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
    },
  })
