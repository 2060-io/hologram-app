import { StyleSheet } from 'react-native'

import { AppTheme, cardShadowStyles, cardStyles } from '@2060/styles'
import { widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    subContainer: {
      width: widthPercentageToDP('92%'),
      alignSelf: 'center',
      paddingVertical: 20,
    },
    containerOption: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 14,
      paddingVertical: 13,
    },
    containerOptionCard: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.white,
      padding: 0,
      marginBottom: 10,
    },
    optionText: {
      marginLeft: 11,
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
    },
  })
