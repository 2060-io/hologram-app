import { StyleSheet } from 'react-native'

import { MESSAGE_INPUT_INITIAL_HEIGHT } from '../InputToolbarView/styles'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      height: MESSAGE_INPUT_INITIAL_HEIGHT + 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.grey,
    },
    deleteButtonContainer: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      paddingLeft: 15,
    },
    selectedText: {
      flex: 8,
      fontSize: theme.fontSize.md,
      color: theme.colors.blue,
      textAlign: 'center',
    },
    forwardButtonContainer: {
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 15,
    },
    enabledButton: {
      opacity: 1,
    },
    disabledButton: {
      opacity: 0.5,
    },
  })
