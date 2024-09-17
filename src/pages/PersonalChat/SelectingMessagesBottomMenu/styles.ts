import { StyleSheet } from 'react-native'

import { MESSAGE_INPUT_INITIAL_HEIGHT } from '../InputToolbarView/styles'

import { AppTheme } from '@2060/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 15,
      height: MESSAGE_INPUT_INITIAL_HEIGHT + 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1.5,
      borderTopColor: theme.colors.grey,
    },
    selectedText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.blue,
    },
  })
