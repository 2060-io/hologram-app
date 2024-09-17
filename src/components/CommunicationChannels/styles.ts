import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerChannel: {
      width: '100%',
      flexDirection: 'row',
      marginBottom: heightPercentageToDP('1.51%'),
      alignItems: 'center',
    },
    channelText: {
      flex: 1,
      fontSize: theme.fontSize.md2,
      marginLeft: widthPercentageToDP('2.57%'),
    },
  })
