import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerMain: {
      width: widthPercentageToDP('75%'),
    },
    containerOptions: {
      alignSelf: 'center',
      width: '87%',
    },
    description: {
      color: theme.colors.blue,
      fontSize: theme.fontSize.md2,
      paddingVertical: 8,
      paddingLeft: 8,
    },
    containerOptionSelected: {
      borderWidth: 0,
      backgroundColor: '#D7F2F0',
      opacity: 0.9,
    },
    containerOption: {
      borderColor: theme.colors.blue,
      borderWidth: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 9,
      paddingVertical: 7,
      marginBottom: theme.edges.messageMargin,
    },
    optionText: {
      fontSize: theme.fontSize.md2 - 1,
      textAlign: 'center',
    },
  })
