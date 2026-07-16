import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.53)',
      flex: 1,
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.secondary,
      borderTopRightRadius: 20,
      borderTopLeftRadius: 20,
      paddingTop: 16,
    },
    containerIcon: {
      alignSelf: 'center',
      height: 4.28,
      width: 32,
      backgroundColor: theme.isDarkMode ? '#F5F7F8' : '#807F85',
      borderRadius: 10,
      marginTop: 3.26,
    },
  })

export default styles
