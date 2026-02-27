import { StyleSheet, ViewStyle } from 'react-native'
import { EdgeInsets } from 'react-native-safe-area-context'

import { IS_ANDROID } from '@src/constants'
import { AppTheme } from '@src/styles'

const BASE_MARGIN_TOP = 10
const ANDROID_BASE_MARGIN_BOTTOM = 10
const IOS_BASE_MARGIN_BOTTOM = 15
const CONTROL_BUTTON_SIZE = 50
const CAPTURE_BUTTON_SIZE = 78
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1

const baseControlButton: ViewStyle = {
  width: CONTROL_BUTTON_SIZE,
  height: CONTROL_BUTTON_SIZE,
  borderRadius: CONTROL_BUTTON_SIZE / 2,
  backgroundColor: 'rgba(140, 140, 140, 0.3)',
}
const centerItems: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
}
const alignItemsSpaceAround: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
}

export default (theme: AppTheme, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    closeButton: {
      ...centerItems,
      ...baseControlButton,
      position: 'absolute',
      left: 20,
      top: insets.top + BASE_MARGIN_TOP,
      zIndex: 3,
    },
    flashButton: {
      ...centerItems,
      ...baseControlButton,
      position: 'absolute',
      right: 20,
      top: insets.top + BASE_MARGIN_TOP,
      zIndex: 2,
    },
    baseControlButton: {
      ...centerItems,
      ...baseControlButton,
    },
    recordingTimeContainer: {
      ...alignItemsSpaceAround,
      ...StyleSheet.absoluteFillObject,
      top: insets.top + BASE_MARGIN_TOP,
      width: '100%',
      height: 40,
    },
    recordingTime: {
      ...centerItems,
      width: 120,
      height: '100%',
      backgroundColor: theme.colors.red,
      borderRadius: 10,
    },
    recordingTimeText: {
      color: theme.colors.white,
      fontSize: theme.fontSize.md2,
    },
    bottomButtonsContainer: {
      ...alignItemsSpaceAround,
      position: 'absolute',
      bottom: insets.bottom,
      left: 0,
      right: 0,
    },
    recordingVideo: {
      position: 'absolute',
      bottom: 0,
      width: CAPTURE_BUTTON_SIZE,
      height: CAPTURE_BUTTON_SIZE,
      borderRadius: CAPTURE_BUTTON_SIZE / 2,
      backgroundColor: '#e34077',
      alignSelf: 'center',
    },
    mainButton: {
      width: CAPTURE_BUTTON_SIZE,
      height: CAPTURE_BUTTON_SIZE,
      borderRadius: CAPTURE_BUTTON_SIZE / 2,
      borderWidth: BORDER_WIDTH,
      borderColor: theme.colors.white,
      alignSelf: 'center',
      bottom: 0,
    },
    sendButton: {
      ...centerItems,
      ...baseControlButton,
      backgroundColor: theme.colors.green,
      position: 'absolute',
      bottom: IS_ANDROID ? ANDROID_BASE_MARGIN_BOTTOM : IOS_BASE_MARGIN_BOTTOM,
      right: 20,
      zIndex: 2,
    },
  })
