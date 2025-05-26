import { StyleSheet } from 'react-native'

import { AppTheme, cardStyles } from '@2060/styles'

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
    headerTitleContainerStyle: {
      maxWidth: '100%',
    },
    mb12: {
      marginBottom: 12,
    },
    pickerIconContainer: {
      top: 18,
      right: '2%',
    },
    inputPickerContainer: {
      ...cardStyles(theme),
      marginVertical: 12,
      fontSize: theme.fontSize.md2,
      fontFamily: 'EuclidCircularA-SemiBold',
      color: theme.colors.tertiaryText,
      paddingVertical: 12,
      paddingRight: 30,
      maxHeight: 45,
    },
    text: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
    },
  })

export default styles
