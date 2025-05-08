import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginHorizontal: 15,
    },
    subContainer: {
      flex: 1,
    },
    btnQr: {
      paddingLeft: widthPercentageToDP('4%'),
    },
    btnEdit: {
      paddingRight: widthPercentageToDP('4%'),
    },
    containerProfile: {
      alignItems: 'center',
      alignSelf: 'center',
      paddingTop: heightPercentageToDP('6.1%'),
      paddingBottom: heightPercentageToDP('3.70%'),
    },
    displayName: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.primaryText,
      paddingTop: heightPercentageToDP('2.77%'),
      textTransform: 'capitalize',
      textAlign: 'center',
    },
    appVersionContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    appVersionText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.sm,
    },
  })
