import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(0,0,0, 0.53)',
      flex: 1,
    },
    modalFullScreen: {
      backgroundColor: theme.colors.secondary,
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 27,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
  })

export default styles
