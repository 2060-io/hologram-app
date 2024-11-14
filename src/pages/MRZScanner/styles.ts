import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    cameraContainer: {
      flex: 1,
      width: '90%',
    },
    headerContainer: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      textAlign: 'center',
      color: theme.colors.green,
      fontSize: theme.fontSize.md2,
      marginTop: 6,
      marginBottom: 12,
    },
    instructions: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
      marginHorizontal: 15,
    },
    refuse: {
      color: theme.colors.blue,
      textAlign: 'center',
      fontSize: theme.fontSize.md2,
    },
    topOverlayContainer: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    bottomOverlayContainer: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    headerLeft: {
      paddingHorizontal: 15,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
  })
