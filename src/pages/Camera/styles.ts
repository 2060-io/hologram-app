import { StyleSheet, ViewStyle } from 'react-native'

import { AppTheme } from '@2060/styles'

const CAPTURE_BUTTON_SIZE = 78
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1
const hexTransparency = (color: string, transparency: string): string => `#${transparency}${color.slice(1)}`

const centerItems: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
}
const alignItemsSpaceAround: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
}

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    closeButton: {
      ...centerItems,
      position: 'absolute',
      left: 20,
      top: 40,
      zIndex: 3,
      height: 40,
      width: 40,
      backgroundColor: hexTransparency(theme.colors.darkGrey, '4D'),
      borderRadius: 20,
    },
    flashButton: {
      ...centerItems,
      position: 'absolute',
      right: 20,
      top: 40,
      zIndex: 2,
    },
    recordingTimeContainer: {
      ...alignItemsSpaceAround,
      ...StyleSheet.absoluteFillObject,
      top: 40,
      width: '100%',
      height: 40,
    },
    recordingTime: {
      ...centerItems,
      width: 80,
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
      bottom: 20,
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
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 50,
      height: 50,
      zIndex: 2,
      backgroundColor: theme.colors.green,
      borderRadius: 25,
    },
  })
