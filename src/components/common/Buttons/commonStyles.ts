import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      width: widthPercentageToDP('92%'),
      height: 45,
      borderRadius: 23,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      marginRight: 10,
    },
    text: {
      textAlign: 'center',
      fontSize: theme.fontSize.md2,
    },
  })
