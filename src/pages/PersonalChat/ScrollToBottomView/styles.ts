import { StyleSheet } from 'react-native'

import { MESSAGE_INPUT_INITIAL_HEIGHT } from '../InputToolbarView/styles'

import { secondaryColor, whiteColor } from '@2060/constants'
import { AppTheme } from '@2060/styles'

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
      backgroundColor: secondaryColor,
      alignItems: 'center',
      justifyContent: 'center',
      width: 25,
      height: 25,
      borderRadius: 12.5,
      right: 0,
      left: -15,
      top: -15,
      bottom: 0,
    },
    newMsgText: {
      color: whiteColor,
      fontSize: 16,
    },
  })
