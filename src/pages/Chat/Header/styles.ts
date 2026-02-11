import { StyleSheet } from 'react-native'

import { AppTheme, headerHeight } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      height: headerHeight,
      paddingHorizontal: 12,
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
