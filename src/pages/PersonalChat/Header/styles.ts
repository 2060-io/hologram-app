import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export const headerHeight = heightPercentageToDP('7%')

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      height: headerHeight,
      paddingHorizontal: widthPercentageToDP('4%'),
      borderBottomWidth: 1.5,
      borderBottomColor: theme.colors.grey,
    },
    containerHeader: {
      flex: 1,
      justifyContent: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    containerAvatar: {
      marginHorizontal: widthPercentageToDP('4%'),
    },
    displayName: {
      flex: 1,
    },
    name: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg + 1.26,
    },
    typing: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
    },
    containerIconMenu: {
      marginLeft: widthPercentageToDP('4.25%'),
    },
    //STYLES FOR SELECTING MESSAGES HEADER
    subContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    cancelText: {
      marginRight: 14,
    },
  })
