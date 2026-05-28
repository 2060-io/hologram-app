import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      flex: 1,
      marginTop: 15,
      alignItems: 'center',
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md,
      textAlign: 'center',
    },
    mainTitle: {
      marginHorizontal: 50,
      marginVertical: 15,
    },
    rejectedIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 32,
      backgroundColor: 'red',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: widthPercentageToDP('84%'),
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      marginTop: 2,
    },
    presentedDateContainer: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    presentedDateText: {
      marginLeft: 15,
    },
    issuerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
    },
    presentedText: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.tertiaryText,
    },
    verifierNameContainer: {
      flex: 1,
      marginLeft: 15,
    },
    verifierName: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    viewInChatButton: {
      alignSelf: 'flex-end',
      backgroundColor: theme.isDarkMode ? theme.colors.secondaryGrey : theme.colors.lightGrey,
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
    },
    viewInChatText: {
      fontSize: theme.fontSize.sm,
      color: theme.isDarkMode ? theme.colors.grey : '#6A8994',
    },
  })
