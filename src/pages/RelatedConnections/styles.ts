import { StyleSheet } from 'react-native'

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
    connectionRelatedToText: {
      fontSize: theme.fontSize.md2,
      paddingVertical: 15,
      textAlign: 'center',
    },
    letterStyle: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
    },
    containerEmptyList: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    textEmpty: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.xl,
    },
    containerConnectionItem: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
      backgroundColor: 'white',
    },
    listItemText: {
      margin: 12,
      fontSize: theme.fontSize.lg,
      color: theme.colors.primaryText,
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
    rightHeaderButton: {
      paddingRight: 17.12,
    },
    searchInputContainer: {
      marginTop: 13,
      width: widthPercentageToDP('95%'),
    },
  })
