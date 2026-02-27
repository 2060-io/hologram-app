import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
    },
    subContainer: {
      flex: 6,
      justifyContent: 'center',
    },
    answerWithoutVideoContainer: {
      flex: 2,
      width: '100%',
    },
    buttonsSubContainer: {
      flex: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
    },
    textConnectionName: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.tertiaryText,
      marginTop: 8,
      textAlign: 'center',
    },
  })
