import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondary,
    },
    subContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    connectedContainer: {
      width: '100%',
      height: '100%',
    },
    callingAvatar: {
      height: '50%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    remoteStreamContainer: {
      width: '100%',
      height: '100%',
    },
    localStreamContainer: {
      width: '25%',
      height: '20%',
      top: 70,
      right: 20,
      position: 'absolute',
      zIndex: 2,
    },
    localStream: {
      width: '100%',
      height: '100%',
    },
    displayButtons: {
      display: 'flex',
    },
    hideButtons: {
      display: 'none',
    },
    buttonsContainer: {
      position: 'absolute',
      bottom: 70,
      width: '100%',
      alignItems: 'center',
      zIndex: 1,
    },
    buttonsSubContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      marginBottom: 45,
    },
    text: {
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.md,
      marginTop: 10,
    },
    textConnectionName: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.tertiaryText,
      marginTop: 8,
      textAlign: 'center',
    },
    textConnectionLost: {
      color: theme.colors.orange,
      fontSize: theme.fontSize.md,
      marginTop: 14,
    },
  })
