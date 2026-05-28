import { IS_IOS } from '@src/constants'
import { AppTheme } from '@src/styles'
import { widthPercentageToDP } from '@src/utils/responsiveUtils'
import { StyleSheet } from 'react-native'

export const MESSAGE_INPUT_INITIAL_HEIGHT = widthPercentageToDP(IS_IOS ? '10%' : '12%')
const MICROPHONE_ICON_CONTAINER_WHILE_RECORDING = widthPercentageToDP('15%')

export default (theme: AppTheme, isRecording?: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 17.12,
      paddingVertical: 5,
    },
    subContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    replyViewInMsg: {
      borderTopLeftRadius: 9,
      borderTopRightRadius: 3,
    },
    leftAndCenterContainer: {
      flexDirection: 'row',
      flex: 1,
      marginRight: 4,
    },
    messageInputContainer: {
      flex: 1,
      marginLeft: 4,
    },
    rightContainer: {
      width: MESSAGE_INPUT_INITIAL_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    containerRecording: {
      width: '100%',
      height: MESSAGE_INPUT_INITIAL_HEIGHT,
      flexDirection: 'row',
      backgroundColor: theme.colors.grey,
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: 16,
      ...(isRecording
        ? {
            display: 'flex',
            position: 'absolute',
            zIndex: 1,
          }
        : {
            display: 'none',
            position: 'relative',
            zIndex: 0,
          }),
    },
    recordingStylesWhenResponding: {
      borderTopRightRadius: 0,
      borderTopLeftRadius: 0,
      borderTopWidth: 0,
    },
    recordTime: {
      flex: 1,
      color: theme.colors.tertiaryText,
      fontSize: theme.fontSize.md2,
      marginLeft: 10,
    },
    cancelVoiceRecord: {
      color: theme.colors.green,
      fontSize: theme.fontSize.md2,
    },
    cancelVoiceRecord2: {
      color: theme.colors.secondaryText,
      fontSize: theme.fontSize.md2,
      marginLeft: 8,
    },
    iconContainer: {
      backgroundColor: theme.isDarkMode ? theme.colors.primary : theme.colors.secondary,
      width: MESSAGE_INPUT_INITIAL_HEIGHT,
      height: MESSAGE_INPUT_INITIAL_HEIGHT,
      borderRadius: MESSAGE_INPUT_INITIAL_HEIGHT / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    microphoneIconContainerWhileRecording: {
      backgroundColor: theme.colors.green,
      width: MICROPHONE_ICON_CONTAINER_WHILE_RECORDING,
      height: MICROPHONE_ICON_CONTAINER_WHILE_RECORDING,
      borderRadius: MICROPHONE_ICON_CONTAINER_WHILE_RECORDING / 2,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: -5,
      right: -5,
      zIndex: 2,
    },
    containerRecordingSwipeUp: {
      width: widthPercentageToDP('10%'),
      height: 75,
      borderRadius: 20,
      justifyContent: 'space-between',
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: theme.colors.grey,
      position: 'absolute',
      zIndex: 1,
      right: 5,
      bottom: MICROPHONE_ICON_CONTAINER_WHILE_RECORDING + 10,
    },
  })
