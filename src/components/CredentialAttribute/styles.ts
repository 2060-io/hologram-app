import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    sectionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionKey: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
    },
    sectionValue: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md,
    },
    sectionKeyImage: {
      width: 40,
      height: 40,
      marginLeft: 10,
    },
  })

export default styles
