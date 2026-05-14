import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginHorizontal: 15,
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
    displayConnectionsList: {
      display: 'flex',
    },
    hideConnectionsList: {
      display: 'none',
    },
  })
