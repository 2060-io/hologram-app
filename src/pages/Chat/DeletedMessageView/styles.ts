import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'

export const REACTIONS_MARGIN_BOTTOM = 20
export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    deletedText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
      margin: theme.edges.messageMargin,
      marginRight: 4,
    },
    subContainerAckAndTime: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      alignItems: 'center',
      marginLeft: 'auto',
      paddingRight: 8,
      marginBottom: 4,
    },
    timeText: {
      color: theme.colors.primaryText,
      fontSize: 10,
      textTransform: 'uppercase',
      marginRight: 4,
    },
  })
