import { StyleSheet } from 'react-native'

import { cardShadowStyles, cardStyles } from '@src/styles'
import { AppTheme } from '@src/styles/types'
import { waterColor } from '@src/utils/colorUtils'
import { heightPercentageToDP } from '@src/utils/responsiveUtils'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '92%',
      alignSelf: 'center',
      marginTop: 19,
    },
    containerOptionCard: {
      ...cardStyles(theme),
      ...cardShadowStyles(theme.colors),
      backgroundColor: theme.isDarkMode ? theme.colors.grey : theme.colors.white,
      padding: 0,
      marginBottom: 8,
    },
    btnTextFilterOptionSelected: {
      backgroundColor: waterColor(theme.colors.green),
      borderWidth: 1,
      borderColor: theme.colors.green,
    },
    containerOption: {
      width: '100%',
      height: heightPercentageToDP('5.8%'),
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 12.84,
    },
    btnOptionText: {
      fontSize: theme.fontSize.md2 + 1,
      color: theme.colors.primaryText,
      marginLeft: 12,
    },
  })

export default styles
