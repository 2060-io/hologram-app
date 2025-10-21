import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    containerContent: {
      width: widthPercentageToDP('93%'),
      alignSelf: 'center',
    },
    textDescriptionLink: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md + 1,
      lineHeight: 22,
      paddingVertical: heightPercentageToDP('2.54%'),
      textAlign: 'center',
    },
    containerInput: {
      borderColor: theme.colors.lightGrey,
      backgroundColor: theme.colors.primary,
      height: heightPercentageToDP('19.11%'),
      borderWidth: 1,
      borderRadius: 8,
    },
    input: {
      flex: 1,
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md + 1,
      paddingLeft: 10,
      fontFamily: 'EuclidCircularA-Regular',
    },
    containerCodeScanner: {
      flex: 1,
    },
    containerDescriptionScanner: {
      position: 'absolute',
      width: widthPercentageToDP('91%'),
      alignSelf: 'center',
      borderWidth: 0.5,
      borderColor: theme.colors.primary,
      borderRadius: 8,
      backgroundColor: theme.colors.secondary,
      zIndex: 1,
      paddingHorizontal: 30,
      paddingVertical: 10,
      marginTop: 20,
      marginLeft: 10,
    },
    textDescriptionScanner: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md + 1,
      lineHeight: 18,
      textAlign: 'center',
    },
    containerBtnOpen: {
      marginTop: 20,
      width: widthPercentageToDP('32%'),
    },
    containerTabs: {
      height: heightPercentageToDP('6.05%'),
      width: '100%',
      backgroundColor: theme.isDarkMode ? theme.colors.darkGrey : theme.colors.lightGrey,
      flexDirection: 'row',
    },
    containerTab: {
      height: '100%',
      width: '50%',
      justifyContent: 'center',
    },
    tabText: {
      fontSize: theme.fontSize.md + 1,
      color: theme.colors.secondaryText,
      textAlign: 'center',
      lineHeight: 22,
      fontWeight: '600',
    },
    selectedTabText: {
      color: theme.colors.primaryText,
    },
    containerSelectedTab: {
      borderBottomWidth: 3,
      borderBottomColor: theme.colors.green,
    },
  })
