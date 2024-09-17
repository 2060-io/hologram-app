import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export const REACTIONS_MARGIN_BOTTOM = 20
export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioButton: {
      marginHorizontal: 15,
    },
    leftContainer: {
      flex: 1,
      alignItems: 'flex-start',
      marginLeft: 8,
    },
    rightContainer: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: 8,
    },
    subContainer: {
      maxWidth: widthPercentageToDP('75%'),
      minHeight: heightPercentageToDP('4.62%'),
    },
    floatingMessageContainer: {
      marginTop: 12,
    },
    leftSubContainer: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
    },
    rightSubContainer: {
      backgroundColor: theme.isDarkMode ? theme.colors.darkGrey : theme.colors.lightGrey,
    },
    messageTextContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginVertical: 8.56,
      marginHorizontal: 8.56,
    },
    containerAckAndTime: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginVertical: 8.56,
      marginRight: 8.56,
    },
    containerTimeLeft: {
      marginLeft: 4.28,
      marginRight: 0,
      marginBottom: 0,
    },
    containerTimeRight: {
      marginLeft: 4.28,
      marginRight: 4.28,
      marginBottom: 0,
    },
    timeText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.sm - 1,
      textTransform: 'uppercase',
      marginRight: 4,
    },
    reactionsContainer: {
      minWidth: 35,
      ...cardShadowStyles(theme.colors),
      shadowColor: theme.isDarkMode ? theme.colors.white : theme.colors.black,
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      flexDirection: 'row',
      borderRadius: 25,
      paddingLeft: 8,
      paddingVertical: 4,
      position: 'absolute',
      bottom: -REACTIONS_MARGIN_BOTTOM,
    },
    reactionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    reactionsContainerStyleForSender: {
      right: 6,
      alignSelf: 'flex-end',
    },
    reactionsContainerStyleForReceiver: {
      left: 6,
      alignSelf: 'flex-start',
    },
    reactionEmoji: {
      fontSize: theme.fontSize.md,
      color: 'black',
    },
    reactionEmojiQuantity: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.primaryText,
      marginLeft: 1,
    },
  })
