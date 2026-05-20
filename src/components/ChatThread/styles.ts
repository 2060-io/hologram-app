import { AppTheme } from '@src/styles/types'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      paddingVertical: 10.7,
      justifyContent: 'center',
      paddingHorizontal: 17.12,
    },
    nameUser: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg + 1.26,
    },
    contentText: {
      flex: 1,
      paddingLeft: 14.98,
    },
    rightContent: {
      height: '100%',
      alignItems: 'flex-end',
      marginTop: 5,
      marginLeft: 10,
    },
    textDate: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.secondaryText,
    },
    textPreview: {
      fontSize: theme.fontSize.sm + 1.84,
      color: theme.colors.secondaryText,
    },
    numberConversationText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.sm + 1.84,
    },
    unread: {
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      backgroundColor: theme.colors.green,
      marginLeft: 5,
    },
    textNumber: {
      color: theme.colors.white,
      fontSize: theme.fontSize.sm,
      textAlign: 'center',
    },
    containerIconChevron: {
      justifyContent: 'center',
    },
    containerUnreadAndStateIcon: {
      marginTop: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
  })

export default styles
