import { stat } from '@dr.pogodin/react-native-fs'
import { useAudioRecorder, useAudioPlayer } from '@simform_solutions/react-native-audio-waveform/lib/hooks'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity } from 'react-native'

import ComposerInput from '../ComposerInput'
import RepliedMessageView from '../RepliedMessageView/RepliedMessageView'
import { getMinutesAndSeconds } from '../utils'

import { SendButton, AudioButton } from './components'
import getStyles from './styles'

import { Icon, SvgIcon, Text } from '@src/components/common'
import { TextInputForwardRefProps } from '@src/components/common/TextInput'
import { useChatActions } from '@src/hooks'
import { useChat } from '@src/hooks/agent'
import { generateFileName } from '@src/hooks/media/files'
import { useTheme } from '@src/hooks/providers/ThemeProvider'
import { logWarn } from '@src/utils'
import { deleteFile } from '@src/utils/RNFS'
import {
  handleMicrophonePermission,
  checkMicrophonePermission,
  askMicrophonePermission,
} from '@src/utils/permissions'
import { toast } from '@src/utils/toast'

interface Props {
  onShowMediaOptions(): void
  showMediaOptions: boolean
}

const MINIMUM_AUDIO_DURATION = 1000
const INITIAL_TIME_RECORDED = '00:00'

const InputToolbarView = (props: Props) => {
  const { startRecording, stopRecording } = useAudioRecorder()
  const { onCurrentRecordingWaveformData } = useAudioPlayer()
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
  const theme = useTheme()
  const styles = getStyles(theme, isRecordingVoiceNote)

  useEffect(() => {
    const audioRecordingListener = onCurrentRecordingWaveformData(result => {
      setRecordTime(getMinutesAndSeconds(result.progress))
    })
    return () => {
      audioRecordingListener.remove()
    }
  }, [])

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
    const { size } = await stat(recordedAudioFilePath.current)
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

  const startRecordVoice = useCallback(async () => {
    let canRecord = await checkMicrophonePermission()
    if (!canRecord) {
      canRecord = await askMicrophonePermission()
      if (canRecord) setAutomaticRecording()
    }
    if (canRecord) {
      setRecordTime(INITIAL_TIME_RECORDED)
      setIsRecordingVoiceNote(true)
      startRecording({
        sampleRate: 11025, // A quarter of the standard value (44100)
        bitRate: 32000, // A quarter of the standard value (128000)
      }).catch(error => logWarn(`Error starting recording note voice: ${error}`))
    }
  }, [])

  const onStopRecorder = async () => {
    setIsRecordingVoiceNote(false)
    setIsAutomaticRecording(false)
    try {
      const [path, duration] = await stopRecording()
      recordedAudioFilePath.current = path
      millisecondsRecorded.current = Number(duration)
    } catch (e) {
      logWarn(`Error stopping recording note voice: ${e}`)
    }
  }

  const sendVoiceMessage = async () => {
    await onStopRecorder()
    shareFileAndSend()
  }

  const cancelAudioRecording = async () => {
    await onStopRecorder()
    await deleteFile(recordedAudioFilePath.current)
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
            <Icon as="FontAwesome" name="microphone" size={20} color={theme.colors.red} />
            <Text style={styles.recordTime}>{recordTime}</Text>
            {isAutomaticRecording ? (
              <TouchableOpacity onPress={cancelAudioRecording}>
                <Text style={styles.cancelVoiceRecord}>{t('general.cancel')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <SvgIcon name="leftArrow" width={12} height={12} fill={theme.colors.secondaryText} />
                <Text style={styles.cancelVoiceRecord2}>{t('general.swipeToUndo')}</Text>
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
