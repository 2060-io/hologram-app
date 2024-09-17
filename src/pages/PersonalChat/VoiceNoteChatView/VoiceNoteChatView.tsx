import { Slider } from '@sharcoux/slider'
import React, { memo, useState, useEffect, useRef } from 'react'
import { View, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native'
import { PlayBackType } from 'react-native-audio-recorder-player'

import { getMinutesAndSeconds } from '../utils'

import getStyles from './styles'

import { Text, Icon } from '@2060/components/common'
import { useMedia } from '@2060/hooks'
import { useChat } from '@2060/hooks/agent'
import { AudioStatus, useMediaPlayer } from '@2060/hooks/agent/MediaPlayerProvider'
import { useTheme } from '@2060/hooks/providers/ThemeProvider'
import { ChatEntryRole, MediaUploadState, VoiceNoteMetadata } from '@2060/model'
import { getFileSize } from '@2060/utils'
import { getFullLocalFilePath } from '@2060/utils/RNFS'

export type VoiceNoteChatViewProps = {
  mediaRecordId: string
  mediaItem: VoiceNoteMetadata
  renderTimeAndTicks: (containerStyle: ViewStyle) => false | React.JSX.Element
  role: ChatEntryRole
}

const VoiceNoteChatView = memo(
  ({ mediaRecordId, mediaItem, renderTimeAndTicks, role }: VoiceNoteChatViewProps) => {
    const theme = useTheme()
    const styles = getStyles(theme)
    const { localFilePath, byteCount, duration, mediaUploadState, mediaDownloadState } = mediaItem
    const [currentPosition, setCurrentPosition] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playedTime, setPlayedTime] = useState('00:00')
    const [audioDuration, setAudioDuration] = useState(0)
    const isFirstTime = useRef(true)
    const { isRecordingVoiceNote } = useChat()
    const {
      playAudio,
      pauseAudio,
      resumeAudio,
      audioPlaybackSpeed,
      changeAudioPlaybackSpeed,
      seekToAudioPlayer,
    } = useMediaPlayer()
    const { isDownloaded, isDownloading, downloadMedia, retryMediaUpload, isRetryingUpload } = useMedia({
      mediaRecordId,
      localFilePath,
      type: 'audio',
      mediaDownloadState,
      role,
    })

    const durationTime = getMinutesAndSeconds(duration ?? 0)
    const isMediaUploadError =
      mediaUploadState === MediaUploadState.ErrorCreating ||
      mediaUploadState === MediaUploadState.ErrorUploading
    const voiceNoteFilePath = localFilePath ? `file://${getFullLocalFilePath(localFilePath)}` : undefined

    useEffect(() => {
      if (isRecordingVoiceNote && isPlaying) pauseAudio()
    }, [isRecordingVoiceNote])

    const playerCallback = ({ status, data }: { status: AudioStatus; data?: PlayBackType }) => {
      if (status === AudioStatus.STARTED) {
        setIsPlaying(true)
      } else if (status === AudioStatus.PLAYING) {
        if ((data?.currentPosition as number) <= 0) return
        if (isFirstTime.current && data?.duration) setAudioDuration(data.duration)
        isFirstTime.current = false
        setCurrentPosition(data?.currentPosition as number)
        const playTimeFormatted = getMinutesAndSeconds(data?.currentPosition ?? 0)
        setPlayedTime(playTimeFormatted)
      } else if (status === AudioStatus.PAUSED) {
        setIsPaused(true)
      } else if (status === AudioStatus.RESUMED) {
        setIsPaused(false)
      } else if (status === AudioStatus.FINISHED) {
        onPlayFinish()
      }
    }

    const onPlayFinish = () => {
      setCurrentPosition(0)
      setIsPaused(false)
      setIsPlaying(false)
      setPlayedTime('00:00')
    }

    const onSlidingStart = async () => {
      if (isPlaying) await pauseAudio()
    }

    const onSlidingComplete = async (timePosition: number) => {
      if (!voiceNoteFilePath) return
      await seekToAudioPlayer(timePosition)
      await resumeAudio(voiceNoteFilePath, currentPosition, playerCallback)
    }

    const handleButtonPlay = () => {
      if (!voiceNoteFilePath) return
      if (!isPlaying && voiceNoteFilePath) {
        playAudio(voiceNoteFilePath, playerCallback)
        return
      }
      isPaused ? resumeAudio(voiceNoteFilePath, currentPosition, playerCallback) : pauseAudio()
    }

    const getIconName = () => {
      if (!isPlaying || isPaused) return 'play'
      return 'pause'
    }

    return (
      <View style={styles.container}>
        <View style={styles.subContainer}>
          <View style={styles.containerButtonPlay}>
            {isDownloaded ? (
              isMediaUploadError ? (
                isRetryingUpload ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <TouchableOpacity onPress={retryMediaUpload}>
                    <Icon as="MaterialCommunityIcons" name="upload" size={24} color={theme.colors.white} />
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity onPress={handleButtonPlay}>
                  <Icon
                    as="MaterialCommunityIcons"
                    name={getIconName()}
                    size={24}
                    color={theme.colors.white}
                  />
                </TouchableOpacity>
              )
            ) : isDownloading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <TouchableOpacity onPress={downloadMedia}>
                <Icon as="MaterialCommunityIcons" name="arrow-down" size={24} color={theme.colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <Slider
            value={Math.floor(currentPosition)}
            minimumTrackTintColor={theme.colors.green}
            maximumTrackTintColor={'#6A8994'}
            thumbTintColor={theme.colors.green}
            slideOnTap={true}
            step={1}
            thumbSize={10}
            minimumValue={0}
            maximumValue={audioDuration}
            trackHeight={6}
            onSlidingStart={onSlidingStart}
            onSlidingComplete={onSlidingComplete}
          />
        </View>
        <View style={styles.footerContainer}>
          <View style={styles.footerSubContainer}>
            {isDownloaded ? (
              <Text typography="EuclidCircularA-Regular" style={{ ...styles.txtCounter, width: 30 }}>
                {!isPlaying ? durationTime : playedTime}
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
                display: isPlaying && !isPaused ? 'flex' : 'none',
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
