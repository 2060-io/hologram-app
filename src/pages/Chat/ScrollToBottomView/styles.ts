import { StyleSheet } from 'react-native'

import { MESSAGE_INPUT_INITIAL_HEIGHT } from '../InputToolbarView/styles'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
      opacity: 0.9,
      position: 'absolute',
      right: 10,
      bottom: 90,
      height: MESSAGE_INPUT_INITIAL_HEIGHT,
      width: MESSAGE_INPUT_INITIAL_HEIGHT,
      borderRadius: MESSAGE_INPUT_INITIAL_HEIGHT / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    containerMsgNew: {
      position: 'absolute',
      backgroundColor: theme.colors.green,
      alignItems: 'center',
      justifyContent: 'center',
      width: 25,
      height: 25,
      borderRadius: 12.5,
      right: 0,
      left: -10,
      top: -10,
      bottom: 0,
    },
    newMsgText: {
      color: theme.colors.white,
      fontSize: theme.fontSize.md,
    },
  })
