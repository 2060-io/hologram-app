import { StyleSheet } from 'react-native'

import { primaryColor, secondaryColor } from '@2060/constants'
import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containierMain: {
      flex: 1,
      marginHorizontal: 15,
      backgroundColor: theme.colors.secondary,
    },
    containerHeaderTitle: {
      flexShrink: 1,
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    containerImage: {
      height: widthPercentageToDP('9.50%'),
      width: widthPercentageToDP('9.50%'),
      borderRadius: 50,
      marginHorizontal: 16,
    },
    avatarHeader: {
      height: '100%',
      width: '100%',
      resizeMode: 'contain',
      borderRadius: 50,
    },
    titleHeader: {
      fontSize: theme.fontSize.lg + 1.26,
      color: theme.colors.primaryText,
      flexShrink: 1,
    },
    btnDone: {
      paddingRight: 15,
    },
    btnDoneText: {
      fontSize: 16,
      color: secondaryColor,
      fontWeight: '700',
    },
    connectionRelatedToText: {
      fontSize: theme.fontSize.md2,
      paddingVertical: 15,
      textAlign: 'center',
    },
    letterStyle: {
      color: primaryColor,
      fontSize: 15,
    },
    containerEmptyList: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    textEmpty: {
      fontSize: 20,
      color: primaryColor,
    },

    containerConnectionItem: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
      backgroundColor: 'white',
    },
    listItemText: {
      margin: 12,
      fontSize: 18,
      color: primaryColor,
    },
    sectionHeaderContainer: {
      paddingVertical: 12,
      paddingLeft: 10,
    },
    sectionHeaderLabel: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
      fontFamily: 'EuclidCircularA-Medium',
      textTransform: 'uppercase',
    },

    // sectionHeaderContainer: {
    //   backgroundColor: '#EEEDED',
    //   padding: 8,
    // },
    // sectionHeaderLabel: {
    //   fontSize: 18,
    //   color: secondaryColor,
    // },
    rightHeaderButton: {
      paddingRight: 17.12,
    },
    searchInputContainer: {
      marginTop: 13,
      width: widthPercentageToDP('95%'),
    },
  })
