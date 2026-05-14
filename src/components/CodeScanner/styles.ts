import { AppTheme } from '@src/styles'
import { screenHeight } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerLoadingCamera: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingCameraText: {
      color: theme.colors.primaryText,
      fontSize: theme.fontSize.xl,
      lineHeight: 20,
    },
    camera: {
      height: screenHeight,
      zIndex: -1,
    },
  })
