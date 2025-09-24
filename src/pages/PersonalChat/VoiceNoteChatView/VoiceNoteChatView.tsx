import {
  FinishMode,
  IWaveformRef,
  PlayerState,
  Waveform,
} from '@simform_solutions/react-native-audio-waveform'
import React, { memo, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native'

import getStyles from './styles'

import { Text, Icon } from '@2060/components/common'
import { useMedia } from '@2060/hooks'
import { useChat } from '@2060/hooks/agent'
import { useMediaPlayer } from '@2060/hooks/providers/MediaPlayerProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, MediaUploadState, VoiceNoteMetadata } from '@2060/model'
import { getFileSize, getMinutesAndSeconds, logWarn } from '@2060/utils'
import { getFullLocalFilePath } from '@2060/utils/RNFS'

type VoiceNoteChatViewProps = {
  mediaRecordId: string
  metadata: VoiceNoteMetadata
  renderTimeAndTicks: (containerStyle: ViewStyle) => false | React.JSX.Element
  role: ChatEntryRole
  chatEntryId: string
  previousMessageId?: string
  isLastMessage: boolean
}

let currentPlayingRef: React.RefObject<IWaveformRef> | undefined

const VoiceNoteChatView = memo(
  ({
    mediaRecordId,
    metadata,
    renderTimeAndTicks,
    role,
    chatEntryId,
    previousMessageId,
    isLastMessage,
  }: VoiceNoteChatViewProps) => {
    const { t } = useTranslation()
    const theme = useTheme()
    const styles = getStyles(theme)
    const { localFilePath, byteCount, duration, mediaUploadState, mediaDownloadState, waveform } = metadata
    const durationTime = getMinutesAndSeconds(duration ?? 0)
    const isMediaUploadError =
      mediaUploadState === MediaUploadState.ErrorCreating ||
      mediaUploadState === MediaUploadState.ErrorUploading
    const [playedTime, setPlayedTime] = useState('00:00')
    const ref = useRef<IWaveformRef>(null)
    const prevPlaterState = useRef<PlayerState>(undefined)
    const [playerState, setPlayerState] = useState(PlayerState.stopped)
    const playerStateAux = useRef(PlayerState.stopped)
    const voiceNoteFilePath = localFilePath ? getFullLocalFilePath(localFilePath) : undefined
    const { isRecordingVoiceNote } = useChat()
    const {
      audioPlaybackSpeed,
      changeAudioPlaybackSpeed,
      audioMessageIdFinished,
      updateAudioMessageIdFinished,
      updatePlayingAudioInfo,
    } = useMediaPlayer()
    const { isDownloaded, isDownloading, downloadMedia, retryMediaUpload, isRetryingUpload } = useMedia({
      mediaRecordId,
      localFilePath,
      type: 'audio',
      mediaDownloadState,
      role,
    })

    // hook to determine if note voice should autoplay
    useEffect(() => {
      const shouldAutoPlay = isDownloaded && previousMessageId && audioMessageIdFinished === previousMessageId
      if (shouldAutoPlay) handlePlayPause()
    }, [audioMessageIdFinished, isDownloaded])

    // hook to pause player if its playing audio and user starts to record note voice
    useEffect(() => {
      if (isRecordingVoiceNote && playerState === PlayerState.playing) pausePlayer()
    }, [isRecordingVoiceNote])

    useEffect(() => {
      const wasPlaying = prevPlaterState.current === PlayerState.playing
      const isStopped = playerState === PlayerState.stopped
      const hasFinishedPlaying = wasPlaying && isStopped
      if (hasFinishedPlaying) {
        updateAudioMessageIdFinished(isLastMessage ? undefined : chatEntryId)
      }
      playerStateAux.current = playerState
      updatePlayingAudioInfo(playerState, voiceNoteFilePath!, pausePlayer)
    }, [playerState])

    const onPlayerStateChange = (newState: PlayerState) => {
      setPlayerState(prevState => {
        prevPlaterState.current = prevState
        return newState
      })
    }

    const onCurrentProgressChange = (currentProgress: number) => {
      if (!currentProgress) return
      const playTimeFormatted = getMinutesAndSeconds(currentProgress)
      setPlayedTime(playTimeFormatted)
    }

    const pausePlayer = async () => {
      await currentPlayingRef?.current?.pausePlayer()
    }

    const startNewPlayer = async () => {
      currentPlayingRef = ref as React.RefObject<IWaveformRef>
      if (ref.current?.currentState === PlayerState.paused) {
        await ref.current?.resumePlayer()
      } else {
        await ref.current?.startPlayer({
          finishMode: FinishMode.stop,
        })

        // If the player took too much time to initialize and another player
        // started instead we pause the former one!
        if (currentPlayingRef?.current?.playerKey !== ref?.current?.playerKey) {
          await ref?.current?.pausePlayer()
        }
      }
    }

    const handlePlayPause = async () => {
      // If no player or if current player is stopped just start the new player!
      if (
        currentPlayingRef == null ||
        [PlayerState.stopped, PlayerState.paused].includes(
          currentPlayingRef?.current?.currentState as PlayerState,
        )
      ) {
        await startNewPlayer()
      } else {
        // Pause current player if it was playing
        if (currentPlayingRef?.current?.currentState === PlayerState.playing) {
          await pausePlayer()
        }
        // Start player when it is a different one!
        if (currentPlayingRef?.current?.playerKey !== ref?.current?.playerKey) {
          await startNewPlayer()
        }
      }
    }

    return (
      <View style={styles.container}>
        <View style={styles.subContainer}>
          <View style={styles.containerButtonPlay}>
            {isDownloading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : isDownloaded ? (
              isMediaUploadError ? (
                isRetryingUpload ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <TouchableOpacity onPress={retryMediaUpload}>
                    <Icon as="MaterialCommunityIcons" name="upload" size={24} color={theme.colors.white} />
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity onPress={handlePlayPause}>
                  <Icon
                    as="MaterialCommunityIcons"
                    name={playerState === PlayerState.playing ? 'pause' : 'play'}
                    size={24}
                    color={theme.colors.white}
                  />
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity onPress={downloadMedia}>
                <Icon as="MaterialCommunityIcons" name="arrow-down" size={24} color={theme.colors.white} />
              </TouchableOpacity>
            )}
          </View>
          {voiceNoteFilePath ? (
            <Waveform
              ref={ref}
              containerStyle={styles.waveFormContainer}
              defaultWaveForm={waveform ? JSON.parse(waveform) : []}
              mode="static"
              playbackSpeed={audioPlaybackSpeed}
              path={voiceNoteFilePath}
              scrubColor={theme.colors.green}
              waveColor={theme.isDarkMode ? '#B8D2D9' : '#6A8994'}
              onPlayerStateChange={onPlayerStateChange}
              onCurrentProgressChange={onCurrentProgressChange}
              onError={error => {
                logWarn(`Error playing or loading voice note: ${error}`)
              }}
            />
          ) : (
            <View style={styles.noWaveFormContainer}>
              <Text typography="EuclidCircularA-Regular" style={styles.noWaveFormText}>
                {t('preview.voiceNote')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.footerContainer}>
          <View style={styles.footerSubContainer}>
            {isDownloaded ? (
              <Text typography="EuclidCircularA-Regular" style={{ ...styles.txtCounter, width: 30 }}>
                {playerState === PlayerState.stopped ? durationTime : playedTime}
              </Text>
            ) : (
              byteCount && (
                <Text typography="EuclidCircularA-Regular" style={styles.txtCounter}>
                  {getFileSize(byteCount)}
                </Text>
              )
            )}
            <TouchableOpacity
              style={{
                display: playerState === PlayerState.playing ? 'flex' : 'none',
                ...styles.playbackSpeedContainer,
              }}
              onPress={changeAudioPlaybackSpeed}
            >
              <Text
                typography="EuclidCircularA-Medium"
                style={[styles.txtCounter, { color: theme.colors.white }]}
              >{`${audioPlaybackSpeed}x`}</Text>
            </TouchableOpacity>
          </View>
          {renderTimeAndTicks(styles.subContainer)}
        </View>
      </View>
    )
  },
)

export default VoiceNoteChatView
