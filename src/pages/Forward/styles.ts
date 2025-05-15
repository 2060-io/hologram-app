import { StyleSheet } from 'react-native'

import { IS_IOS } from '@2060/constants'
import { AppTheme } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

const FORWARD_BUTTON_WIDTH = widthPercentageToDP(IS_IOS ? '10%' : '12%')

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    connectionsContainer: {
      flex: 9,
    },
    forwardContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    connectionsToForwardText: {
      flex: 1,
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      marginRight: 10,
    },
    forwardButton: {
      width: FORWARD_BUTTON_WIDTH,
      height: FORWARD_BUTTON_WIDTH,
      borderRadius: FORWARD_BUTTON_WIDTH / 2,
      backgroundColor: theme.colors.green,
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
