import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const NORMAL_WIDTH = widthPercentageToDP('70')

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: NORMAL_WIDTH,
      marginBottom: 6,
    },
  })
