import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    containerMain: {
      flex: 1,
    },
    containerRootAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 20,
    },
    btnClose: {
      ...cardShadowStyles(theme.colors),
      alignItems: 'center',
      backgroundColor: hexTransparency(theme.colors.white, 'F2'),
      borderRadius: 16,
      height: 31,
      justifyContent: 'center',
      position: 'absolute',
      right: 13,
      top: 13,
      width: 31,
      zIndex: 1,
    },
    containerOptions: {
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: widthPercentageToDP('46%'),
      paddingBottom: 20,
    },
    containerOption: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    containerOptionIcon: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      width: 54,
      height: 54,
      borderRadius: 27,
    },
    optionText: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.primaryText,
      paddingTop: 8,
    },
    textInput: {
      alignSelf: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      color: theme.colors.primaryText,
      fontFamily: 'EuclidCircularA-Medium',
      fontSize: theme.fontSize.md2,
      height: 43,
      paddingLeft: 10,
      width: widthPercentageToDP('92%'),
    },
    textInputDescription: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md + 1,
      paddingBottom: 12,
      paddingTop: 18,
      textAlign: 'center',
    },
  })

export default styles
