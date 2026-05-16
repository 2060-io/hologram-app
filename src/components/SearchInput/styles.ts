import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    containerTextInput: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 50,
      height: 45,
      paddingHorizontal: 17,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      borderWidth: 0.5,
      borderColor: theme.colors.secondaryText,
    },
    textInput: {
      flex: 1,
      fontFamily: 'EuclidCircularA-Medium',
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      marginLeft: 18,
    },
  })

export default styles
