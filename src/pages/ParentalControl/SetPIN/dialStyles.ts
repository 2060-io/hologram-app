import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

const DIAL_PAD_SIZE_CONTAINER = widthPercentageToDP('17%')
export const DIAL_SIZE = 35

export default (theme: AppTheme) =>
  StyleSheet.create({
    empty: {
      width: DIAL_PAD_SIZE_CONTAINER,
      height: DIAL_PAD_SIZE_CONTAINER,
    },
    buttonContainer: {
      width: DIAL_PAD_SIZE_CONTAINER,
      height: DIAL_PAD_SIZE_CONTAINER,
      borderRadius: DIAL_PAD_SIZE_CONTAINER / 2,
      backgroundColor: theme.isDarkMode ? theme.colors.secondaryGrey : theme.colors.grey,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialText: {
      fontSize: DIAL_SIZE,
      color: theme.colors.tertiaryText,
    },
  })
