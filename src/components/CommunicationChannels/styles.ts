import { AppTheme } from '@src/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

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
