import { AppTheme } from '@src/styles'
import { Dimensions, StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    rightHeaderButton: {
      paddingLeft: 17.12,
    },
    bgSelectedChat: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
    },
    bgContainerChat: {
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
    },
    searchInputContainer: {
      width: Dimensions.get('screen').width * 0.95,
      alignSelf: 'center',
    },
    containerHeaderRight: {
      flexDirection: 'row',
      paddingRight: 17.12,
    },
    btnIconContextMenu: {
      paddingLeft: 17.12,
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
  })

export default styles
