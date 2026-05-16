import { AppTheme } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
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
    title: {
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
    joinButton: {
      flex: 1,
    },
    expiredContainer: {
      backgroundColor: hexTransparency(theme.colors.orange, theme.isDarkMode ? '2E' : '1A'),
      borderRadius: 10,
      padding: 4,
      alignItems: 'center',
    },
    expiredText: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.orange,
    },
  })
