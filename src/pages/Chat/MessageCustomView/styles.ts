import { AppTheme, cardShadowStyles } from '@src/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

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
      marginLeft: theme.edges.messageMargin,
    },
    rightContainer: {
      flex: 1,
      alignItems: 'flex-end',
      marginRight: theme.edges.messageMargin,
    },
    subContainer: {
      maxWidth: widthPercentageToDP('75%'),
      minHeight: heightPercentageToDP('4.62%'),
      overflow: 'hidden',
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
    containerAckAndTime: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: theme.edges.messageMargin,
      marginRight: theme.edges.messageMargin,
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
      color: theme.colors.black,
    },
    reactionEmojiQuantity: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.primaryText,
      marginLeft: 1,
    },
    tappedRepliedMessageTemporaryStyle: {
      borderWidth: 2,
      borderColor: theme.colors.green,
    },
    removedRepliedMessageTemporaryStyle: {
      borderWidth: 0,
      borderColor: 'transparent',
    },
  })
