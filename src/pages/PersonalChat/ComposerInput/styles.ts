import { StyleSheet } from 'react-native'

import { MESSAGE_INPUT_INITIAL_HEIGHT } from '../InputToolbarView/styles'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      minHeight: MESSAGE_INPUT_INITIAL_HEIGHT,
      maxHeight: widthPercentageToDP('24.94%'),
      borderRadius: 16,
      backgroundColor: theme.colors.grey,
      paddingLeft: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      paddingTop: 0,
      paddingRight: 8,
      color: theme.colors.primaryText,
      fontFamily: 'EuclidCircularA-Medium',
      fontSize: theme.fontSize.md2,
    },
    composerStylesWhenResponding: {
      borderTopRightRadius: 0,
      borderTopLeftRadius: 0,
      borderTopWidth: 0,
    },
  })
