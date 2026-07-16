import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.isDarkMode
        ? hexTransparency(theme.colors.black, 'CC')
        : hexTransparency(theme.colors.white, 'CC'),
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    display: {
      display: 'flex',
    },
    hide: {
      display: 'none',
    },
    messageContainer: {
      maxHeight: '50%',
      overflow: 'hidden',
    },
    menuContainer: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      width: widthPercentageToDP('50%'),
      borderWidth: 0.5,
      borderColor: theme.isDarkMode ? theme.colors.primary : theme.colors.grey,
      paddingVertical: 5,
    },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      justifyContent: 'space-between',
    },
    optionText: {
      fontSize: theme.fontSize.md2,
    },
    separator: {
      borderBottomWidth: 1,
      borderBottomColor: hexTransparency('#6A8994', '29'),
    },
  })
