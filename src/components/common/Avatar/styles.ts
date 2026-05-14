import { AppTheme } from '@src/styles'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerAvatar: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: theme.colors.primary,
    },
    avatar: {
      height: '100%',
      width: '100%',
    },
    initials: {
      color: '#A1B0B5',
      textTransform: 'uppercase',
    },
  })
