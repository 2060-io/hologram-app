import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullOverlay: {
      backgroundColor: 'transparent',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    containerBgView: {
      backgroundColor: hexTransparency(theme.colors.black, '87'),
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    containerAuthCard: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: widthPercentageToDP('92%'),
      alignItems: 'center',
      paddingBottom: 40,
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.xl + 4,
      textAlign: 'center',
      paddingBottom: 20,
    },
    enableText: {
      color: theme.colors.darkGrey,
      textAlign: 'center',
      fontSize: theme.fontSize.lg,
    },
    containerEnableError: {
      width: '100%',
      borderWidth: 2,
      borderColor: theme.colors.red,
      borderRadius: 6,
      paddingHorizontal: 16,
      marginBottom: 20,
      marginHorizontal: 16,
      backgroundColor: hexTransparency(theme.colors.red, '0D'),
    },
    containerIconWarning: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.red,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 10,
      marginTop: 20,
    },
    enableErrorText: {
      fontSize: theme.fontSize.lg + 1,
      color: theme.colors.primaryText,
      lineHeight: 27.4,
      textAlign: 'center',
      paddingBottom: 15,
    },
    containerBtnAuth: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 23,
      backgroundColor: theme.colors.green,
      paddingHorizontal: 30,
      paddingVertical: 10,
      marginTop: 20,
    },
    btnAuthText: {
      color: theme.colors.white,
      fontSize: theme.fontSize.md2,
      paddingLeft: 15,
      textAlign: 'center',
    },
    containerBtnRetry: {
      width: widthPercentageToDP('43%'),
      backgroundColor: theme.colors.secondary,
      borderRadius: 23,
      paddingVertical: 10,
      marginTop: 20,
    },
    btnRetryText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
      textAlign: 'center',
    },
  })
