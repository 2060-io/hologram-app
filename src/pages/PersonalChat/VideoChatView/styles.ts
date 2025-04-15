import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    containerRootVideo: {
      minWidth: widthPercentageToDP('56%'),
      maxHeight: heightPercentageToDP('34.67%'),
    },
    videoDescription: {
      paddingHorizontal: 8,
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
    },
    containerVideo: {
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
    },
    btnPlayVideo: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDownload: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: hexTransparency(theme.colors.primaryText, '4D'),
      borderRadius: 50,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    textsize: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primary,
    },
    containerDuration: {
      flex: 1,
      bottom: 4,
      left: 10,
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
    },
    textDuraction: {
      color: theme.colors.primary,
      fontSize: theme.fontSize.md2,
      paddingLeft: 5,
    },
    imageBackground: {
      height: '100%',
      width: '100%',
    },
    containerViewDownlod: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: hexTransparency(theme.colors.black, '4D'),
    },
    containerSpinner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      position: 'absolute',
      height: '100%',
      width: '100%',
    },
    spinnerText: {
      color: theme.colors.secondary,
      fontSize: theme.fontSize.md2,
    },
    uploadProgressContainer: {
      height: 5,
      borderRadius: 0,
      marginBottom: 0,
    },
  })
