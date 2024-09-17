import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles/types'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

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
    contentDate: {
      height: '100%',
      alignItems: 'flex-end',
      marginTop: 10,
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
      width: widthPercentageToDP('5%'),
      height: widthPercentageToDP('5%'),
      justifyContent: 'center',
      borderRadius: 50,
      backgroundColor: theme.colors.green,
      marginTop: 8,
    },
    textNumber: {
      color: theme.colors.white,
      fontSize: theme.fontSize.sm,
      textAlign: 'center',
    },
    containerIconChevron: {
      justifyContent: 'center',
    },
  })

export default styles
