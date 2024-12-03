import type { AudioSet } from 'react-native-audio-recorder-player'

import { uuid } from '@credo-ts/core/build/utils/uuid'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Platform, TouchableOpacity } from 'react-native'
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVModeIOSOption,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player'
import * as RNFS from 'react-native-fs'
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  withRepeat,
  Easing,
  withSequence,
} from 'react-native-reanimated'

import ComposerInput from '../ComposerInput'
import RepliedMessageView from '../RepliedMessageView/RepliedMessageView'

import { SendButton, AudioButton } from './components'
import getStyles from './styles'

import { Icon, SvgIcon, Text } from '@2060/components/common'
import { TextInputForwardRefProps } from '@2060/components/common/TextInput'
import { useChatActions } from '@2060/hooks'
import { useChat } from '@2060/hooks/agent'
import { generateFileName } from '@2060/hooks/media/files'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { deleteFile } from '@2060/utils/RNFS'
import {
  handleMicrophonePermission,
  checkMicrophonePermission,
  askMicrophonePermission,
} from '@2060/utils/permissions'

const IconAnimated = Reanimated.createAnimatedComponent(Icon)

interface Props {
  onShowMediaOptions(): void
  showMediaOptions: boolean
}

const INITIAL_TIME_RECORDED = '00:00'

const InputToolbarView = (props: Props) => {
  const { t } = useTranslation()
  const [recordTime, setRecordTime] = useState(INITIAL_TIME_RECORDED)
  const secondsRecorded = useRef(0)
  const [isAutomaticRecording, setIsAutomaticRecording] = useState(false)
  const recordedFile = useRef('')
  const [valueTextInput, setValueTextInput] = useState('')
  const textInputRef = useRef<TextInputForwardRefProps>(null)
  const recorder = useRef(new AudioRecorderPlayer()).current
  const { setRepliedMessage, isRecordingVoiceNote, setIsRecordingVoiceNote, repliedMessage } = useChat()
  const { sendTextMessage, shareMediaToDidComm } = useChatActions()
  const { showMediaOptions, onShowMediaOptions } = props
  const isRepliedMessage = repliedMessage !== undefined
  const hasContentTextInput = valueTextInput.trim().length !== 0
  const animatedOpacity = useSharedValue(1)
  const styleIconRecord = useAnimatedStyle(() => ({ opacity: animatedOpacity.value }), [])
  const theme = useTheme()
  const styles = getStyles(theme, isRecordingVoiceNote)

  const shareFileAndSend = async () => {
    const { size } = await RNFS.stat(recordedFile.current)
    const subType = Platform.OS === 'ios' ? 'm4a' : 'mp4'
    const mime = `audio/${subType}`
    const filename = generateFileName(mime, subType)

    await shareMediaToDidComm({
      mime,
      size,
      path: recordedFile.current,
      fileName: filename,
      duration: Math.floor(secondsRecorded.current),
    })
  }

  const startRecordVoice = useCallback(async () => {
    let canRecord = await checkMicrophonePermission()
    if (!canRecord) {
      canRecord = await askMicrophonePermission()
      canRecord && setAutomaticRecording()
    }
    if (canRecord) {
      const path = Platform.select({
        ios: `${uuid()}.m4a`,
        android: `${RNFS.CachesDirectoryPath}/${uuid()}.mp4`,
      })
      const audioSet: AudioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVModeIOS: AVModeIOSOption.voicechat,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      }
      setIsRecordingVoiceNote(true)
      setRecordTime(INITIAL_TIME_RECORDED)
      secondsRecorded.current = 0
      const pathFile = await recorder.startRecorder(path, audioSet, false)
      recorder.addRecordBackListener(({ isRecording: arpIsRecording, currentPosition }) => {
        if (arpIsRecording || currentPosition) {
          secondsRecorded.current = currentPosition
          setRecordTime(recorder.mmssss(Math.floor(currentPosition)).slice(0, 5))
        }
      })
      recordedFile.current = pathFile
      startAnimationRecord()
    }
  }, [])

  const onCancelAnimation = () => {
    cancelAnimation(animatedOpacity)
    animatedOpacity.value = 1
  }

  const onStopRecorder = async () => {
    setIsRecordingVoiceNote(false)
    await recorder.stopRecorder()
    recorder.removeRecordBackListener()
    onCancelAnimation()
  }

  const sendVoiceMessage = useCallback(async () => {
    setIsAutomaticRecording(false)
    onCancelAnimation()
    await onStopRecorder()
    shareFileAndSend()
  }, [recordedFile.current])

  const cancelAudioRecording = useCallback(async () => {
    setIsAutomaticRecording(false)
    onCancelAnimation()
    await onStopRecorder()
    await deleteFile(recordedFile.current)
  }, [recordedFile.current])

  const startAnimationRecord = () => {
    animatedOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    )
  }

  useEffect(() => {
    return () => {
      setIsRecordingVoiceNote(false)
      onStopRecorder()
    }
  }, [])

  const sendMessage = async () => {
    setValueTextInput('')
    await sendTextMessage(valueTextInput)
  }

  const setAutomaticRecording = useCallback(() => setIsAutomaticRecording(true), [])

  const handleRepliedMessageChangeToFocusTextInput = () => {
    if (repliedMessage) textInputRef?.current?.onFocus()
  }

  useEffect(handleRepliedMessageChangeToFocusTextInput, [repliedMessage])

  return (
    <View style={styles.container}>
      {isRepliedMessage && (
        <RepliedMessageView
          onDismiss={() => setRepliedMessage()}
          repliedMessage={repliedMessage}
          isInputToolbarView={true}
          style={styles.replyViewInMsg}
        />
      )}
      <View style={styles.subContainer}>
        <View style={styles.leftAndCenterContainer}>
          {showMediaOptions && (
            <TouchableOpacity style={styles.iconContainer} onPress={onShowMediaOptions} activeOpacity={0.7}>
              <SvgIcon name="add" fill={theme.colors.primaryText} />
            </TouchableOpacity>
          )}
          <ComposerInput
            textInputRef={textInputRef}
            isRepliedMessage={isRepliedMessage}
            onTextChanged={setValueTextInput}
            valueTextInput={valueTextInput}
          />
          <View style={[styles.containerRecording, isRepliedMessage && styles.recordingStylesWhenResponding]}>
            <IconAnimated
              as="FontAwesome"
              name="microphone"
              size={20}
              color={theme.colors.red}
              style={styleIconRecord}
            />
            <Text typography="EuclidCircularA-Regular" style={styles.recordTime}>
              {recordTime}
            </Text>
            {isAutomaticRecording ? (
              <TouchableOpacity onPress={cancelAudioRecording}>
                <Text typography="EuclidCircularA-Regular" style={styles.cancelVoiceRecord}>
                  {t('general.cancel')}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <SvgIcon name="leftArrow" width={12} height={12} fill={theme.colors.secondaryText} />
                <Text typography="EuclidCircularA-Regular" style={styles.cancelVoiceRecord2}>
                  {t('general.swipeToUndo')}
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.rightContainer}>
          {!showMediaOptions || hasContentTextInput ? (
            <SendButton hasContentTextInput={hasContentTextInput} sendMessage={sendMessage} />
          ) : (
            <AudioButton
              onPress={isRecordingVoiceNote ? sendVoiceMessage : handleMicrophonePermission}
              onLongPress={startRecordVoice}
              onTouchEnd={isRecordingVoiceNote && !isAutomaticRecording ? sendVoiceMessage : undefined}
              isRecording={isRecordingVoiceNote}
              isAutomaticRecording={isAutomaticRecording}
              setAutomaticRecording={setAutomaticRecording}
              cancelAudioRecording={cancelAudioRecording}
            />
          )}
        </View>
        {isRecordingVoiceNote && !isAutomaticRecording && (
          <View style={styles.containerRecordingSwipeUp}>
            <SvgIcon name="lock" fill={theme.colors.tertiaryText} />
            <SvgIcon name="upArrow" width={12} height={12} fill={theme.colors.tertiaryText} />
          </View>
        )}
      </View>
    </View>
  )
}

export default InputToolbarView
