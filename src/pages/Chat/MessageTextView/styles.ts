import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    textContainer: {
      margin: theme.edges.messageMargin,
    },
    containerAckAndTime: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      marginLeft: 'auto',
      paddingRight: 8,
      marginBottom: 4,
    },
  })
