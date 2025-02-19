import { useAudioRecorder } from '@simform_solutions/react-native-audio-waveform/lib/hooks'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'
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
import { getMinutesAndSeconds } from '../utils'

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
import { toast } from '@2060/utils/toast'

const IconAnimated = Reanimated.createAnimatedComponent(Icon)

interface Props {
  onShowMediaOptions(): void
  showMediaOptions: boolean
}

const MINIMUM_AUDIO_DURATION = 1000
const INITIAL_TIME_RECORDED = '00:00'
const RECORDER_UPDATE_FREQUENCY = 1000

const InputToolbarView = (props: Props) => {
  const { startRecording, stopRecording } = useAudioRecorder()
  const recorderTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const { t } = useTranslation()
  const [recordTime, setRecordTime] = useState(INITIAL_TIME_RECORDED)
  const millisecondsRecorded = useRef(0)
  const [isAutomaticRecording, setIsAutomaticRecording] = useState(false)
  const recordedAudioFilePath = useRef('')
  const [valueTextInput, setValueTextInput] = useState('')
  const textInputRef = useRef<TextInputForwardRefProps>(null)
  const { setRepliedMessage, isRecordingVoiceNote, setIsRecordingVoiceNote, repliedMessage } = useChat()
  const isRecordingVoiceNoteAux = useRef(isRecordingVoiceNote)
  const { sendTextMessage, shareMediaToDidComm } = useChatActions()
  const { showMediaOptions, onShowMediaOptions } = props
  const isRepliedMessage = repliedMessage !== undefined
  const hasContentTextInput = valueTextInput.trim().length !== 0
  const animatedOpacity = useSharedValue(1)
  const styleIconRecord = useAnimatedStyle(() => ({ opacity: animatedOpacity.value }), [])
  const theme = useTheme()
  const styles = getStyles(theme, isRecordingVoiceNote)

  useEffect(() => {
    isRecordingVoiceNoteAux.current = isRecordingVoiceNote
  }, [isRecordingVoiceNote])

  // hook to cancel audio recording when component unmounts
  useEffect(() => {
    return () => {
      if (isRecordingVoiceNoteAux.current) cancelAudioRecording()
    }
  }, [])

  useEffect(() => {
    if (repliedMessage) textInputRef?.current?.onFocus()
  }, [repliedMessage])

  const shareFileAndSend = async () => {
    if (millisecondsRecorded.current < MINIMUM_AUDIO_DURATION) {
      toast({ message: t('chat.recordedAudioTooShort'), type: 'info' })
      return
    }
    const { size } = await RNFS.stat(recordedAudioFilePath.current)
    const subType = 'm4a'
    const mime = `audio/${subType}`
    const filename = generateFileName(mime, subType)
    await shareMediaToDidComm({
      mime,
      size,
      path: recordedAudioFilePath.current,
      fileName: filename,
      duration: millisecondsRecorded.current,
    })
  }

  const startRecordingVoiceTimer = () => {
    setRecordTime(INITIAL_TIME_RECORDED)
    millisecondsRecorded.current = 0
    let lastTime = Date.now()
    const tick = () => {
      const now = Date.now()
      const diffInMs = now - lastTime
      lastTime = now
      millisecondsRecorded.current += diffInMs
      setRecordTime(getMinutesAndSeconds(millisecondsRecorded.current))
      recorderTimerRef.current = setTimeout(tick, RECORDER_UPDATE_FREQUENCY)
    }
    recorderTimerRef.current = setTimeout(tick, RECORDER_UPDATE_FREQUENCY)
  }

  const startRecordVoice = useCallback(async () => {
    let canRecord = await checkMicrophonePermission()
    if (!canRecord) {
      canRecord = await askMicrophonePermission()
      canRecord && setAutomaticRecording()
    }
    if (canRecord) {
      setIsRecordingVoiceNote(true)
      startRecording()
      startRecordingVoiceTimer()
      startAnimationRecord()
    }
  }, [])

  const onCancelAnimation = () => {
    cancelAnimation(animatedOpacity)
    animatedOpacity.value = 1
  }

  const onStopRecorder = async () => {
    clearTimeout(recorderTimerRef.current)
    setIsRecordingVoiceNote(false)
    setIsAutomaticRecording(false)
    onCancelAnimation()
    const [path, duration] = await stopRecording()
    recordedAudioFilePath.current = path
    millisecondsRecorded.current = Number(duration)
  }

  const sendVoiceMessage = async () => {
    await onStopRecorder()
    shareFileAndSend()
  }

  const cancelAudioRecording = async () => {
    await onStopRecorder()
    await deleteFile(recordedAudioFilePath.current)
  }

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

  const sendMessage = async () => {
    setValueTextInput('')
    await sendTextMessage(valueTextInput)
  }

  const setAutomaticRecording = useCallback(() => setIsAutomaticRecording(true), [])

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
