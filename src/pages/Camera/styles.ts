import { StyleSheet } from 'react-native'

import { AppTheme } from '@2060/styles'

const CAPTURE_BUTTON_SIZE = 78
const BORDER_WIDTH = CAPTURE_BUTTON_SIZE * 0.1
const hexTransparency = (color: string, transparency: string): string => `#${transparency}${color.slice(1)}`

export default (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    camera: {
      ...StyleSheet.absoluteFillObject,
    },
    closeButton: {
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      left: 20,
      top: 40,
      height: 40,
      width: 40,
      backgroundColor: hexTransparency(theme.colors.darkGrey, '4D'),
      borderRadius: 20,
      zIndex: 3,
    },
    flashButton: {
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      right: 20,
      top: 40,
      zIndex: 2,
    },
    buttonsContainer: {
      flexDirection: 'row',
      position: 'absolute',
      left: 0,
      bottom: 20,
      right: 0,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    recordingVideo: {
      width: CAPTURE_BUTTON_SIZE,
      height: CAPTURE_BUTTON_SIZE,
      borderRadius: CAPTURE_BUTTON_SIZE / 2,
      backgroundColor: '#e34077',
      position: 'absolute',
      alignSelf: 'center',
      bottom: 0,
    },
    mainButton: {
      width: CAPTURE_BUTTON_SIZE,
      height: CAPTURE_BUTTON_SIZE,
      borderRadius: CAPTURE_BUTTON_SIZE / 2,
      borderWidth: BORDER_WIDTH,
      borderColor: 'white',
      alignSelf: 'center',
      bottom: 0,
    },
    sendButton: {
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.green,
      width: 50,
      height: 50,
      borderRadius: 25,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
  })
