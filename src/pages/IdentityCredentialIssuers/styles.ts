import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    icon: {
      marginBottom: 10,
    },
    pickerContainer: {
      width: '75%',
      alignSelf: 'center',
    },
    pickerItem: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.md2,
      fontFamily: 'EuclidCircularA-Regular',
    },
    issuerName: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.lg,
      marginTop: 10,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.primaryText,
    },
  })

export default styles
