import { Dimensions, StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    rightHeaderButton: {
      paddingRight: 17.12,
    },
    searchInputContainer: {
      width: Dimensions.get('screen').width * 0.95,
      alignSelf: 'center',
    },
    containerHeaderTitle: {
      flexShrink: 1,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarHeader: {
      height: '100%',
      width: '100%',
      resizeMode: 'contain',
      borderRadius: 50,
    },
    containerListEmpty: {
      height: 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textListEmpty: {
      fontSize: 20,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    btnIconContextMenu: {
      paddingLeft: 17.12,
    },

    bgSelectedChat: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
    },
    bgContainerChat: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    containerImage: {
      height: widthPercentageToDP('9.50%'),
      width: widthPercentageToDP('9.50%'),
      borderRadius: 50,
      marginHorizontal: 16,
    },
  })
