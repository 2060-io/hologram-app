import { AppTheme } from '@src/styles/types'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    backText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.white,
      lineHeight: 20,
    },
    button: {
      height: '100%',
      width: widthPercentageToDP('18.10%'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBackground: {
      backgroundColor: theme.colors.red,
    },
    archiveBackground: {
      backgroundColor: theme.colors.darkGrey,
    },
    unarchiveBackground: {
      backgroundColor: theme.colors.green,
    },
  })

export default styles
