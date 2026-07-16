import { AppTheme, cardShadowStyles, cardStyles } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      padding: 0,
    },
    optionContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    itemSeparator: {
      borderBottomWidth: 1,
      borderBottomColor: hexTransparency('#6A8994', '29'),
    },
    icon: {
      marginRight: 12,
    },
    text: {
      flex: 1,
      marginRight: 12,
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
    },
  })
