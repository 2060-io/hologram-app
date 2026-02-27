import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginHorizontal: 15,
    },
    subContainer: {
      flex: 1,
    },
    scrollViewContentContainerStyle: {
      flexGrow: 1,
    },
    btnQr: {
      paddingLeft: 12,
    },
    btnEdit: {
      paddingRight: 12,
    },
    containerProfile: {
      alignItems: 'center',
      alignSelf: 'center',
      paddingTop: 40,
      marginBottom: 20,
    },
    displayName: {
      fontSize: theme.fontSize.xl,
      color: theme.colors.primaryText,
      marginTop: 14,
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
