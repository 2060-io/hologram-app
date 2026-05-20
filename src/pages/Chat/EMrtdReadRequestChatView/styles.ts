import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

const NORMAL_WIDTH = widthPercentageToDP('75')

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: NORMAL_WIDTH,
    },
    subContainer: {
      margin: theme.edges.messageMargin,
    },
    instructions: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.blue,
      marginBottom: 4,
    },
    buttonsContainer: {
      flexDirection: 'row',
    },
    refuseButton: {
      flex: 1,
      marginRight: 8,
    },
    acceptButton: {
      flex: 1,
    },
    icon: {
      marginBottom: 4,
    },
  })
