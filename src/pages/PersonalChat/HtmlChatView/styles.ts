import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'
import { heightPercentageToDP, widthPercentageToDP } from '@2060/utils/responsiveUtils'

const NORMAL_WIDTH = widthPercentageToDP('70')

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: NORMAL_WIDTH,
      marginBottom: 6,
    },
    webView: {
      width: '100%',
      height: '100%',
    },
    normalScreenDimensions: {
      width: NORMAL_WIDTH,
      height: heightPercentageToDP('50'),
    },
    fullScreenDimensions: {
      width: widthPercentageToDP('95'),
      height: heightPercentageToDP('70'),
    },
    metadataContainer: {
      flexDirection: 'row',
      margin: 6,
    },
    image: {
      width: widthPercentageToDP('20%'),
      height: widthPercentageToDP('20%'),
      resizeMode: 'stretch',
    },
    detailsContainer: {
      flex: 1,
      marginLeft: 5,
      paddingVertical: 6,
    },
    title: {
      fontSize: theme.fontSize.md,
      color: theme.colors.tertiaryText,
    },
    description: {
      fontSize: theme.fontSize.md - 1,
      color: theme.colors.secondaryText,
      marginBottom: 10,
    },
    webViewButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.isDarkMode ? theme.colors.secondary : theme.colors.primary,
      paddingRight: 5,
    },
  })
