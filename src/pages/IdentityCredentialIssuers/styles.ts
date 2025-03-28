import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const styles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      paddingHorizontal: 15,
      paddingVertical: 10,
    },
    headerRight: {
      paddingRight: 15,
    },
    headerText: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.green,
    },
    icon: {
      marginBottom: 10,
    },
    pickerIconContainer: {
      top: 17,
      right: '13%',
    },
    inputPickerContainer: {
      minWidth: '75%',
      maxWidth: '100%',
      alignSelf: 'center',
      marginVertical: 10,
      height: 45,
      fontSize: theme.fontSize.md2,
      fontFamily: 'EuclidCircularA-SemiBold',
      padding: 10,
      borderWidth: 1,
      borderColor: theme.colors.tertiaryText,
      borderRadius: 6,
      color: theme.colors.tertiaryText,
    },
    citizenship: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.tertiaryText,
      marginTop: 10,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
    },
  })

export default styles
