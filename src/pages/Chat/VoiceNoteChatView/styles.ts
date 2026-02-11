import { StyleSheet } from 'react-native'

import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'

const PLAY_BUTTON_WIDTH = widthPercentageToDP('9%')

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: widthPercentageToDP('57%'),
      padding: theme.edges.messageMargin,
    },
    subContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    waveFormContainer: {
      height: 22,
      flex: 1,
    },
    containerButtonPlay: {
      height: PLAY_BUTTON_WIDTH,
      width: PLAY_BUTTON_WIDTH,
      borderRadius: PLAY_BUTTON_WIDTH / 2,
      backgroundColor: theme.colors.green,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 5,
    },
    footerContainer: {
      marginLeft: PLAY_BUTTON_WIDTH,
      height: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerSubContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: '100%',
    },
    displayPlaybackSpeed: {
      display: 'flex',
    },
    hidePlaybackSpeed: {
      display: 'none',
    },
    playbackSpeedContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.green,
      marginLeft: 6,
      width: 30,
      height: '100%',
      borderRadius: 5,
    },
    txtCounter: {
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.sm - 1,
    },
    downloadedText: {
      width: 30,
    },
    noWaveFormContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noWaveFormText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.primaryText,
    },
  })
