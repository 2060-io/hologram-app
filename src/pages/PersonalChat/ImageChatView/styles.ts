import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { hexTransparency } from '@2060/utils/colorUtils'

export default (theme: AppTheme) =>
  StyleSheet.create({
    imageLightbox: {
      width: '100%',
      height: '100%',
    },
    containerViewDownlod: {
      height: '100%',
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
      color: theme.colors.blue,
      fontSize: theme.fontSize.md2,
      paddingTop: 5,
    },
    btnDownload: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: hexTransparency(theme.colors.primaryText, '4D'),
      borderRadius: 50,
      padding: 8,
      position: 'absolute',
      flexDirection: 'row',
    },
    textsize: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
      paddingLeft: 5,
    },
    containerImageView: {
      width: '100%',
      height: '100%',
    },
    descriptionImg: {
      paddingHorizontal: 8,
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
    },
    // styles headerlightbox
    rootHeaderLightbox: {
      flexDirection: 'row',
      paddingHorizontal: 5,
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 80,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    containerHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    containerUserInfo: {
      paddingLeft: 15,
    },
    containerHeaderRight: {
      flex: 0.5,
      justifyContent: 'space-between',
      flexDirection: 'row',
    },
    text: {
      fontSize: theme.fontSize.md2,
      color: theme.colors.primaryText,
    },
    uploadProgressContainer: {
      height: 5,
      borderRadius: 0,
      marginBottom: 0,
    },
  })
