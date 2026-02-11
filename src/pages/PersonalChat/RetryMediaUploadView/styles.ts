import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'
import { hexTransparency } from '@src/utils/colorUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    containerBtn: {
      padding: 8,
      borderRadius: 50,
      backgroundColor: hexTransparency(theme.colors.black, '80'),
    },
    btn: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    btnText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primary,
    },
  })
