import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginHorizontal: 15,
      backgroundColor: theme.colors.secondary,
    },
    searchInputContainer: {
      width: widthPercentageToDP('95%'),
      alignSelf: 'center',
      marginTop: 12,
    },
    headerRight: {
      paddingRight: 15,
    },
    headerLeft: {
      paddingLeft: 15,
    },
    headerBtnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    headerWithSubConnectionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerWithSubConnectionsTitleContainer: {
      marginLeft: 17,
    },
    connectionsRelatedText: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      marginTop: 16,
    },
  })
