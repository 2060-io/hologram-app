import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      height: '100%',
      width: '100%',
    },
    controlOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0, 0.3)',
    },
    contentCenter: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorLoadingVideoText: {
      color: theme.colors.red,
      fontSize: theme.fontSize.lg,
      marginTop: 10,
    },
  })
