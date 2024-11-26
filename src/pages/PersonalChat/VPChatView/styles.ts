import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: widthPercentageToDP('75%'),
    },
    subContainer: {
      margin: 8,
      marginBottom: 0,
    },
    title: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.blue,
      marginBottom: 8,
    },
  })
