import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles, cardShadowStyles } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'

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
    text: {
      flex: 1,
      paddingHorizontal: 12,
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
    },
  })
