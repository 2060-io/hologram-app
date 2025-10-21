import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerMessage: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      width: '95%',
      position: 'absolute',
      minHeight: 35,
      paddingVertical: 10,
      paddingLeft: 10,
      paddingRight: 6,
      zIndex: 1,
      elevation: 1,
      borderRadius: 6,
    },
    textMessage: {
      flex: 9,
      color: theme.colors.white,
      fontSize: theme.fontSize.md,
    },
    rightContainer: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
      justifyContent: 'center',
    },
    close: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 26,
      width: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
  })
